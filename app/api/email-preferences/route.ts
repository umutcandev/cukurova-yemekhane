import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { emailPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/email-preferences — get user's notification preferences
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ notifyFavorites: false });
        }

        const result = await db
            .select({ notifyFavorites: emailPreferences.notifyFavorites })
            .from(emailPreferences)
            .where(eq(emailPreferences.userId, session.user.id));

        return NextResponse.json({
            notifyFavorites: result.length > 0 ? result[0].notifyFavorites : false,
        });
    } catch (error) {
        console.error("Email preferences GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/email-preferences — update notification preference
// Body: { notifyFavorites: true/false }
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { notifyFavorites } = body;

        if (typeof notifyFavorites !== "boolean") {
            return NextResponse.json(
                { error: "notifyFavorites must be a boolean" },
                { status: 400 }
            );
        }

        // Upsert: insert or update
        const existing = await db
            .select()
            .from(emailPreferences)
            .where(eq(emailPreferences.userId, session.user.id));

        if (existing.length > 0) {
            await db
                .update(emailPreferences)
                .set({
                    notifyFavorites,
                    updatedAt: new Date(),
                })
                .where(eq(emailPreferences.userId, session.user.id));
        } else {
            await db.insert(emailPreferences).values({
                userId: session.user.id,
                notifyFavorites,
            });
        }

        return NextResponse.json({ notifyFavorites });
    } catch (error) {
        console.error("Email preferences POST error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
