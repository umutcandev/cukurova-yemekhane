import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { userAllergens, allergenPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limiter";
import { ALLERGEN_ORDER, type AllergenId } from "@/lib/allergens";

const ALLERGEN_PREFS_RATE_LIMIT = 10;

const DIET_PREFERENCES = ["none", "vegetarian", "vegan"] as const;
type DietPreference = (typeof DIET_PREFERENCES)[number];

/**
 * Oturumu olmayan / kaydı olmayan kullanıcı için varsayılanlar.
 * includeProbable VARSAYILAN OLARAK TRUE — güvenli taraf: "içerebilir"
 * uyarıları kullanıcı aksini söyleyene kadar gösterilir.
 */
const DEFAULTS = {
    allergens: [] as AllergenId[],
    includeProbable: true,
    notifyAllergens: false,
    dietPreference: "none" as DietPreference,
};

function isAllergenId(value: unknown): value is AllergenId {
    return typeof value === "string" && ALLERGEN_ORDER.includes(value as AllergenId);
}

// GET /api/allergens — kullanıcının alerjen tercihleri
// Oturumsuz istek 401 değil, boş tercih döner (mevcut desenle tutarlı).
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(DEFAULTS);
        }

        const userId = session.user.id;

        const [selected, prefs] = await Promise.all([
            db
                .select({ allergenId: userAllergens.allergenId })
                .from(userAllergens)
                .where(eq(userAllergens.userId, userId)),
            db
                .select({
                    includeProbable: allergenPreferences.includeProbable,
                    notifyAllergens: allergenPreferences.notifyAllergens,
                    dietPreference: allergenPreferences.dietPreference,
                })
                .from(allergenPreferences)
                .where(eq(allergenPreferences.userId, userId)),
        ]);

        // Sözlükten kalkmış bir alerjen id'si DB'de kalmış olabilir; ele.
        const allergens = selected
            .map((row) => row.allergenId)
            .filter(isAllergenId)
            .sort((a, b) => ALLERGEN_ORDER.indexOf(a) - ALLERGEN_ORDER.indexOf(b));

        return NextResponse.json({
            allergens,
            includeProbable: prefs[0]?.includeProbable ?? DEFAULTS.includeProbable,
            notifyAllergens: prefs[0]?.notifyAllergens ?? DEFAULTS.notifyAllergens,
            dietPreference: prefs[0]?.dietPreference ?? DEFAULTS.dietPreference,
        });
    } catch (error) {
        console.error("Allergen preferences GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/allergens — kısmi güncelleme
// Body: { allergens?: AllergenId[], includeProbable?: boolean,
//         notifyAllergens?: boolean, dietPreference?: "none"|"vegetarian"|"vegan" }
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const rateLimit = await checkRateLimit(userId, {
            prefix: "allergen-preferences",
            maxRequests: ALLERGEN_PREFS_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla istek. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);

        const hasAllergens = has("allergens");
        const hasIncludeProbable = has("includeProbable");
        const hasNotify = has("notifyAllergens");
        const hasDiet = has("dietPreference");

        if (!hasAllergens && !hasIncludeProbable && !hasNotify && !hasDiet) {
            return NextResponse.json(
                { error: "En az bir alan gerekli" },
                { status: 400 }
            );
        }

        if (hasAllergens) {
            if (!Array.isArray(body.allergens) || !body.allergens.every(isAllergenId)) {
                return NextResponse.json(
                    { error: "allergens geçerli alerjen id'lerinden oluşan bir dizi olmalı" },
                    { status: 400 }
                );
            }
        }
        if (hasIncludeProbable && typeof body.includeProbable !== "boolean") {
            return NextResponse.json(
                { error: "includeProbable must be a boolean" },
                { status: 400 }
            );
        }
        if (hasNotify && typeof body.notifyAllergens !== "boolean") {
            return NextResponse.json(
                { error: "notifyAllergens must be a boolean" },
                { status: 400 }
            );
        }
        if (hasDiet && !DIET_PREFERENCES.includes(body.dietPreference)) {
            return NextResponse.json(
                { error: "dietPreference must be none, vegetarian or vegan" },
                { status: 400 }
            );
        }

        if (hasAllergens) {
            // Tam değişim: gelen liste kullanıcının seçiminin tamamıdır.
            const unique = [...new Set(body.allergens as AllergenId[])];
            await db.delete(userAllergens).where(eq(userAllergens.userId, userId));
            if (unique.length > 0) {
                await db
                    .insert(userAllergens)
                    .values(unique.map((allergenId) => ({ userId, allergenId })));
            }
        }

        if (hasIncludeProbable || hasNotify || hasDiet) {
            const existing = await db
                .select({ id: allergenPreferences.id })
                .from(allergenPreferences)
                .where(eq(allergenPreferences.userId, userId));

            if (existing.length > 0) {
                const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
                if (hasIncludeProbable) updatePayload.includeProbable = body.includeProbable;
                if (hasNotify) updatePayload.notifyAllergens = body.notifyAllergens;
                if (hasDiet) updatePayload.dietPreference = body.dietPreference;

                await db
                    .update(allergenPreferences)
                    .set(updatePayload)
                    .where(eq(allergenPreferences.userId, userId));
            } else {
                await db.insert(allergenPreferences).values({
                    userId,
                    includeProbable: hasIncludeProbable
                        ? (body.includeProbable as boolean)
                        : DEFAULTS.includeProbable,
                    notifyAllergens: hasNotify
                        ? (body.notifyAllergens as boolean)
                        : DEFAULTS.notifyAllergens,
                    dietPreference: hasDiet
                        ? (body.dietPreference as DietPreference)
                        : DEFAULTS.dietPreference,
                });
            }
        }

        const [selected, prefs] = await Promise.all([
            db
                .select({ allergenId: userAllergens.allergenId })
                .from(userAllergens)
                .where(eq(userAllergens.userId, userId)),
            db
                .select({
                    includeProbable: allergenPreferences.includeProbable,
                    notifyAllergens: allergenPreferences.notifyAllergens,
                    dietPreference: allergenPreferences.dietPreference,
                })
                .from(allergenPreferences)
                .where(eq(allergenPreferences.userId, userId)),
        ]);

        return NextResponse.json({
            allergens: selected
                .map((row) => row.allergenId)
                .filter(isAllergenId)
                .sort((a, b) => ALLERGEN_ORDER.indexOf(a) - ALLERGEN_ORDER.indexOf(b)),
            includeProbable: prefs[0]?.includeProbable ?? DEFAULTS.includeProbable,
            notifyAllergens: prefs[0]?.notifyAllergens ?? DEFAULTS.notifyAllergens,
            dietPreference: prefs[0]?.dietPreference ?? DEFAULTS.dietPreference,
        });
    } catch (error) {
        console.error("Allergen preferences POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
