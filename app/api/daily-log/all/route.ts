import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { dailyLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/daily-log/all — get all daily logs for the authenticated user
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
            .select()
            .from(dailyLogs)
            .where(eq(dailyLogs.userId, session.user.id))
            .orderBy(desc(dailyLogs.date));

        return NextResponse.json({
            logs: result.map((log) => ({
                date: log.date,
                totalCalories: log.totalCalories,
                consumedMeals: log.consumedMeals || [],
            })),
        });
    } catch (error) {
        console.error("Daily log all GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
