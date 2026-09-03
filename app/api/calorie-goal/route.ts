import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/calorie-goal — get the current user's calorie goal
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await db
            .select({ calorieGoal: users.calorieGoal })
            .from(users)
            .where(eq(users.id, session.user.id));

        return NextResponse.json({
            calorieGoal: result[0]?.calorieGoal ?? null,
        });
    } catch (error) {
        console.error("Calorie goal GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/calorie-goal — set/update the calorie goal
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
        const { calorieGoal } = body;

        if (typeof calorieGoal !== "number" || calorieGoal <= 0) {
            return NextResponse.json(
                { error: "Calorie goal must be a positive number" },
                { status: 400 }
            );
        }

        await db
            .update(users)
            .set({ calorieGoal: Math.round(calorieGoal) })
            .where(eq(users.id, session.user.id));

        return NextResponse.json({
            calorieGoal: Math.round(calorieGoal),
        });
    } catch (error) {
        console.error("Calorie goal POST error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
