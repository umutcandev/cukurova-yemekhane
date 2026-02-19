import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { dailyLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/daily-log?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({
                totalCalories: 0,
                consumedMeals: [],
            });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json(
                { error: "Invalid date format. Use YYYY-MM-DD" },
                { status: 400 }
            );
        }

        const result = await db
            .select()
            .from(dailyLogs)
            .where(
                and(
                    eq(dailyLogs.userId, session.user.id),
                    eq(dailyLogs.date, date)
                )
            );

        if (result.length === 0) {
            return NextResponse.json({
                totalCalories: 0,
                consumedMeals: [],
            });
        }

        return NextResponse.json({
            totalCalories: result[0].totalCalories,
            consumedMeals: result[0].consumedMeals || [],
        });
    } catch (error) {
        console.error("Daily log GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/daily-log
// Body: { date: "YYYY-MM-DD", mealName: "Ekşili Köfte", calories: 294, action: "add" | "remove" }
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
        const { date, mealName, calories, action } = body;

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            );
        }

        if (!mealName || typeof calories !== "number") {
            return NextResponse.json(
                { error: "mealName and calories are required" },
                { status: 400 }
            );
        }

        if (!["add", "remove"].includes(action)) {
            return NextResponse.json(
                { error: "action must be 'add' or 'remove'" },
                { status: 400 }
            );
        }

        // Get or create daily log
        const existing = await db
            .select()
            .from(dailyLogs)
            .where(
                and(
                    eq(dailyLogs.userId, session.user.id),
                    eq(dailyLogs.date, date)
                )
            );

        let currentMeals: Array<{ mealName: string; calories: number }> =
            existing.length > 0 ? (existing[0].consumedMeals as Array<{ mealName: string; calories: number }>) || [] : [];
        let totalCalories = existing.length > 0 ? existing[0].totalCalories : 0;

        if (action === "add") {
            // Check if already added
            const alreadyAdded = currentMeals.some((m) => m.mealName === mealName);
            if (alreadyAdded) {
                return NextResponse.json(
                    { error: "Meal already added" },
                    { status: 409 }
                );
            }
            currentMeals = [...currentMeals, { mealName, calories }];
            totalCalories += calories;
        } else {
            // Remove meal
            const mealIndex = currentMeals.findIndex((m) => m.mealName === mealName);
            if (mealIndex === -1) {
                return NextResponse.json(
                    { error: "Meal not found in log" },
                    { status: 404 }
                );
            }
            totalCalories = Math.max(0, totalCalories - currentMeals[mealIndex].calories);
            currentMeals = currentMeals.filter((_, i) => i !== mealIndex);
        }

        if (existing.length > 0) {
            // If no meals left, delete the record entirely
            if (currentMeals.length === 0) {
                await db
                    .delete(dailyLogs)
                    .where(
                        and(
                            eq(dailyLogs.userId, session.user.id),
                            eq(dailyLogs.date, date)
                        )
                    );

                return NextResponse.json({
                    action,
                    mealName,
                    totalCalories: 0,
                    consumedMeals: [],
                });
            }

            await db
                .update(dailyLogs)
                .set({
                    totalCalories,
                    consumedMeals: currentMeals,
                })
                .where(
                    and(
                        eq(dailyLogs.userId, session.user.id),
                        eq(dailyLogs.date, date)
                    )
                );
        } else {
            await db.insert(dailyLogs).values({
                userId: session.user.id,
                date,
                totalCalories,
                consumedMeals: currentMeals,
            });
        }

        return NextResponse.json({
            action,
            mealName,
            totalCalories,
            consumedMeals: currentMeals,
        });
    } catch (error) {
        console.error("Daily log POST error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
