import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { menuReactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { checkRateLimit, isValidDateFormat } from '@/lib/rate-limiter';

// GET /api/reactions?date=2025-12-30
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date || !isValidDateFormat(date)) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            );
        }

        const result = await db
            .select({
                totalLikes: sql<number>`${menuReactions.likeCount} + COALESCE(${menuReactions.legacyLikeCount}, 0)`,
                totalDislikes: sql<number>`${menuReactions.dislikeCount} + COALESCE(${menuReactions.legacyDislikeCount}, 0)`,
            })
            .from(menuReactions)
            .where(eq(menuReactions.menuDate, date));

        if (result.length === 0) {
            return NextResponse.json({ likeCount: 0, dislikeCount: 0 });
        }

        return NextResponse.json({
            likeCount: result[0].totalLikes,
            dislikeCount: result[0].totalDislikes
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
// Body: { menuDate: "2025-12-30", action: "like" | "dislike" | "removeLike" | "removeDislike" }
export async function POST(request: NextRequest) {
    try {
        // Get IP for rate limiting
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

        // Check rate limit
        const rateLimit = checkRateLimit(ip);
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

        if (!['like', 'dislike', 'removeLike', 'removeDislike'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Use like, dislike, removeLike, or removeDislike' },
                { status: 400 }
            );
        }

        // First, ensure the record exists (upsert)
        await db
            .insert(menuReactions)
            .values({ menuDate, likeCount: 0, dislikeCount: 0 })
            .onConflictDoNothing({ target: menuReactions.menuDate });

        // Now update based on action
        let updateSet: Record<string, unknown>;
        switch (action) {
            case 'like':
                updateSet = {
                    likeCount: sql`${menuReactions.likeCount} + 1`,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                };
                break;
            case 'dislike':
                updateSet = {
                    dislikeCount: sql`${menuReactions.dislikeCount} + 1`,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                };
                break;
            case 'removeLike':
                updateSet = {
                    likeCount: sql`GREATEST(${menuReactions.likeCount} - 1, 0)`,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                };
                break;
            case 'removeDislike':
                updateSet = {
                    dislikeCount: sql`GREATEST(${menuReactions.dislikeCount} - 1, 0)`,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                };
                break;
            default:
                updateSet = {};
        }

        const result = await db
            .update(menuReactions)
            .set(updateSet)
            .where(eq(menuReactions.menuDate, menuDate))
            .returning({
                likeCount: sql<number>`${menuReactions.likeCount} + COALESCE(${menuReactions.legacyLikeCount}, 0)`,
                dislikeCount: sql<number>`${menuReactions.dislikeCount} + COALESCE(${menuReactions.legacyDislikeCount}, 0)`,
            });

        if (!result || result.length === 0) {
            return NextResponse.json(
                { error: 'Failed to update reaction' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            likeCount: result[0].likeCount,
            dislikeCount: result[0].dislikeCount,
            action
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
