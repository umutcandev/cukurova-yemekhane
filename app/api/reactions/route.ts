import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/index';
import { menuReactions, userReactions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { checkRateLimit, isValidDateFormat } from '@/lib/rate-limiter';

// GET /api/reactions?date=2025-12-30
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date || !isValidDateFormat(date)) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            );
        }

        // Fetch counters (legacy + auth-era counts)
        const counters = await db
            .select({
                likeCount: menuReactions.likeCount,
                dislikeCount: menuReactions.dislikeCount,
                legacyLikeCount: menuReactions.legacyLikeCount,
                legacyDislikeCount: menuReactions.legacyDislikeCount,
            })
            .from(menuReactions)
            .where(eq(menuReactions.menuDate, date));

        // Fetch user's own reaction
        const userReaction = await db
            .select({ action: userReactions.action })
            .from(userReactions)
            .where(
                and(
                    eq(userReactions.userId, session.user.id),
                    eq(userReactions.menuDate, date)
                )
            );

        const row = counters.length > 0 ? counters[0] : null;

        return NextResponse.json({
            likeCount: row ? row.legacyLikeCount + row.likeCount : 0,
            dislikeCount: row ? row.legacyDislikeCount + row.dislikeCount : 0,
            userAction: userReaction.length > 0 ? userReaction[0].action : null,
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/reactions
// Body: { menuDate: "2025-12-30", action: "like" | "dislike" }
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // User-based rate limiting
        const rateLimit = checkRateLimit(userId);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please wait.', resetIn: rateLimit.resetIn },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
                    }
                }
            );
        }

        // Parse and validate body
        const body = await request.json();
        const { menuDate, action } = body;

        if (!menuDate || !isValidDateFormat(menuDate)) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            );
        }

        if (!['like', 'dislike'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Use like or dislike' },
                { status: 400 }
            );
        }

        // Find user's existing reaction for this date
        const existing = await db
            .select({ action: userReactions.action })
            .from(userReactions)
            .where(
                and(
                    eq(userReactions.userId, userId),
                    eq(userReactions.menuDate, menuDate)
                )
            );

        const previousAction = existing.length > 0 ? existing[0].action : null;

        // Ensure menu_reactions row exists
        await db
            .insert(menuReactions)
            .values({ menuDate, likeCount: 0, dislikeCount: 0 })
            .onConflictDoNothing({ target: menuReactions.menuDate });

        // Mutate user_reactions
        if (previousAction === action) {
            // Toggle off — remove reaction
            await db
                .delete(userReactions)
                .where(
                    and(
                        eq(userReactions.userId, userId),
                        eq(userReactions.menuDate, menuDate)
                    )
                );
        } else if (previousAction === null) {
            // New reaction — upsert with unique index protection
            await db
                .insert(userReactions)
                .values({ userId, menuDate, action })
                .onConflictDoUpdate({
                    target: [userReactions.userId, userReactions.menuDate],
                    set: { action, updatedAt: new Date() },
                });
        } else {
            // Switching reaction
            await db
                .update(userReactions)
                .set({ action, updatedAt: new Date() })
                .where(
                    and(
                        eq(userReactions.userId, userId),
                        eq(userReactions.menuDate, menuDate)
                    )
                );
        }

        // Recalculate auth-era counters from user_reactions (atomic, race-condition safe)
        // Legacy counts are preserved separately and not recalculated
        await db
            .update(menuReactions)
            .set({
                likeCount: sql`(SELECT COUNT(*) FROM user_reactions WHERE menu_date = ${menuDate} AND action = 'like')`,
                dislikeCount: sql`(SELECT COUNT(*) FROM user_reactions WHERE menu_date = ${menuDate} AND action = 'dislike')`,
                updatedAt: new Date(),
            })
            .where(eq(menuReactions.menuDate, menuDate));

        // Return updated counters (legacy + auth-era) + user action
        const result = await db
            .select({
                likeCount: menuReactions.likeCount,
                dislikeCount: menuReactions.dislikeCount,
                legacyLikeCount: menuReactions.legacyLikeCount,
                legacyDislikeCount: menuReactions.legacyDislikeCount,
            })
            .from(menuReactions)
            .where(eq(menuReactions.menuDate, menuDate));

        const newUserAction = previousAction === action ? null : action;

        return NextResponse.json({
            likeCount: result[0].legacyLikeCount + result[0].likeCount,
            dislikeCount: result[0].legacyDislikeCount + result[0].dislikeCount,
            userAction: newUserAction,
        }, {
            headers: {
                'X-RateLimit-Remaining': String(rateLimit.remaining)
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
