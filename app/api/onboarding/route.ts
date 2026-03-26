import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AUTH_ENABLED } from "@/lib/feature-flags";

// GET /api/onboarding — check if onboarding is completed
export async function GET() {
    if (!AUTH_ENABLED) return NextResponse.json({ error: "Auth disabled" }, { status: 503 });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await db
            .select({ onboardingCompletedAt: users.onboardingCompletedAt })
            .from(users)
            .where(eq(users.id, session.user.id));

        return NextResponse.json({
            completed: result[0]?.onboardingCompletedAt != null,
        });
    } catch (error) {
        console.error("Onboarding GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/onboarding — mark onboarding as completed
export async function POST() {
    if (!AUTH_ENABLED) return NextResponse.json({ error: "Auth disabled" }, { status: 503 });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await db
            .update(users)
            .set({ onboardingCompletedAt: new Date() })
            .where(eq(users.id, session.user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Onboarding POST error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
