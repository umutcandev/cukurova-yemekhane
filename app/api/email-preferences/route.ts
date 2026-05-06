import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { emailPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AUTH_ENABLED } from "@/lib/feature-flags";
import { checkRateLimit } from "@/lib/rate-limiter";

const EMAIL_PREFS_RATE_LIMIT = 10;

// GET /api/email-preferences — get user's notification preferences
export async function GET() {
    if (!AUTH_ENABLED) return NextResponse.json({ notifyFavorites: false, excludeLowCalorie: false });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ notifyFavorites: false, excludeLowCalorie: false });
        }

        const result = await db
            .select({
                notifyFavorites: emailPreferences.notifyFavorites,
                excludeLowCalorie: emailPreferences.excludeLowCalorie,
            })
            .from(emailPreferences)
            .where(eq(emailPreferences.userId, session.user.id));

        return NextResponse.json({
            notifyFavorites: result.length > 0 ? result[0].notifyFavorites : false,
            excludeLowCalorie: result.length > 0 ? result[0].excludeLowCalorie : false,
        });
    } catch (error) {
        console.error("Email preferences GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/email-preferences — update notification preference(s)
// Body (partial): { notifyFavorites?: boolean, excludeLowCalorie?: boolean }
export async function POST(request: NextRequest) {
    if (!AUTH_ENABLED) return NextResponse.json({ error: 'Auth disabled' }, { status: 503 });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const rateLimit = await checkRateLimit(session.user.id, {
            prefix: "email-preferences",
            maxRequests: EMAIL_PREFS_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla istek. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const hasNotify = Object.prototype.hasOwnProperty.call(body, "notifyFavorites");
        const hasExclude = Object.prototype.hasOwnProperty.call(body, "excludeLowCalorie");

        if (!hasNotify && !hasExclude) {
            return NextResponse.json(
                { error: "En az bir alan (notifyFavorites veya excludeLowCalorie) gerekli" },
                { status: 400 }
            );
        }
        if (hasNotify && typeof body.notifyFavorites !== "boolean") {
            return NextResponse.json(
                { error: "notifyFavorites must be a boolean" },
                { status: 400 }
            );
        }
        if (hasExclude && typeof body.excludeLowCalorie !== "boolean") {
            return NextResponse.json(
                { error: "excludeLowCalorie must be a boolean" },
                { status: 400 }
            );
        }

        // Upsert
        const existing = await db
            .select()
            .from(emailPreferences)
            .where(eq(emailPreferences.userId, session.user.id));

        if (existing.length > 0) {
            const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
            if (hasNotify) updatePayload.notifyFavorites = body.notifyFavorites;
            if (hasExclude) updatePayload.excludeLowCalorie = body.excludeLowCalorie;

            await db
                .update(emailPreferences)
                .set(updatePayload)
                .where(eq(emailPreferences.userId, session.user.id));
        } else {
            await db.insert(emailPreferences).values({
                userId: session.user.id,
                notifyFavorites: hasNotify ? (body.notifyFavorites as boolean) : false,
                excludeLowCalorie: hasExclude ? (body.excludeLowCalorie as boolean) : false,
            });
        }

        const fresh = await db
            .select({
                notifyFavorites: emailPreferences.notifyFavorites,
                excludeLowCalorie: emailPreferences.excludeLowCalorie,
            })
            .from(emailPreferences)
            .where(eq(emailPreferences.userId, session.user.id));

        return NextResponse.json(fresh[0]);
    } catch (error) {
        console.error("Email preferences POST error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
