import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { favorites, emailPreferences } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AUTH_ENABLED } from "@/lib/feature-flags";

// GET /api/favorites — get user's favorite meal names
export async function GET() {
    if (!AUTH_ENABLED) return NextResponse.json({ favorites: [] });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ favorites: [] });
        }

        const result = await db
            .select({ mealName: favorites.mealName, mealId: favorites.mealId })
            .from(favorites)
            .where(eq(favorites.userId, session.user.id));

        return NextResponse.json({
            favorites: result.map((r) => ({
                mealName: r.mealName,
                mealId: r.mealId,
            })),
        });
    } catch (error) {
        console.error("Favorites GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/favorites — toggle a favorite
// Body: { mealName: "Ekşili Köfte" }
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

        const body = await request.json();
        const { mealName, mealId } = body;

        if (!mealName || typeof mealName !== "string") {
            return NextResponse.json(
                { error: "mealName is required" },
                { status: 400 }
            );
        }

        // Check if already favorited
        const existing = await db
            .select()
            .from(favorites)
            .where(
                and(
                    eq(favorites.userId, session.user.id),
                    eq(favorites.mealName, mealName)
                )
            );

        if (existing.length > 0) {
            // Remove favorite — never touch email preferences on remove
            await db
                .delete(favorites)
                .where(
                    and(
                        eq(favorites.userId, session.user.id),
                        eq(favorites.mealName, mealName)
                    )
                );
            return NextResponse.json({ action: "removed", mealName, emailOptedIn: false });
        } else {
            // Add favorite
            await db.insert(favorites).values({
                userId: session.user.id,
                mealName,
                mealId: mealId || null,
            });

            // Auto opt-in: only insert if no email preference row exists yet.
            // If the user previously turned off notifications, we must NOT overwrite it.
            const existingPref = await db
                .select({ id: emailPreferences.id })
                .from(emailPreferences)
                .where(eq(emailPreferences.userId, session.user.id));

            let emailOptedIn = false;
            if (existingPref.length === 0) {
                // First ever favorite — opt them in automatically
                await db.insert(emailPreferences).values({
                    userId: session.user.id,
                    notifyFavorites: true,
                });
                emailOptedIn = true;
            }

            return NextResponse.json({ action: "added", mealName, emailOptedIn });
        }
    } catch (error) {
        console.error("Favorites POST error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
