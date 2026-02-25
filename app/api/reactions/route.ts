import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { auth } from '@/lib/auth';
import { checkRateLimit, isValidDateFormat } from '@/lib/rate-limiter';

// GET /api/reactions?date=2025-12-30
export async function GET(request: NextRequest) {
    try {
        // Auth check
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

        // Fetch counters
        const counters = await sql`
            SELECT like_count, dislike_count 
            FROM menu_reactions 
            WHERE menu_date = ${date}
        `;

        // Fetch user's own reaction
        const userReaction = await sql`
            SELECT action 
            FROM user_reactions 
            WHERE user_id = ${session.user.id} AND menu_date = ${date}
        `;

        return NextResponse.json({
            likeCount: counters.length > 0 ? counters[0].like_count : 0,
            dislikeCount: counters.length > 0 ? counters[0].dislike_count : 0,
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
        // Auth check
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
        const existing = await sql`
            SELECT action FROM user_reactions 
            WHERE user_id = ${userId} AND menu_date = ${menuDate}
        `;

        const previousAction = existing.length > 0 ? existing[0].action : null;

        // Ensure menu_reactions row exists
        await sql`
            INSERT INTO menu_reactions (menu_date, like_count, dislike_count)
            VALUES (${menuDate}, 0, 0)
            ON CONFLICT (menu_date) DO NOTHING
        `;

        if (previousAction === action) {
            // Toggle off — remove reaction
            await sql`
                DELETE FROM user_reactions 
                WHERE user_id = ${userId} AND menu_date = ${menuDate}
            `;
            // Decrement counter
            if (action === 'like') {
                await sql`
                    UPDATE menu_reactions 
                    SET like_count = GREATEST(like_count - 1, 0), updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                `;
            } else {
                await sql`
                    UPDATE menu_reactions 
                    SET dislike_count = GREATEST(dislike_count - 1, 0), updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                `;
            }
        } else if (previousAction === null) {
            // New reaction
            await sql`
                INSERT INTO user_reactions (user_id, menu_date, action)
                VALUES (${userId}, ${menuDate}, ${action})
            `;
            if (action === 'like') {
                await sql`
                    UPDATE menu_reactions 
                    SET like_count = like_count + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                `;
            } else {
                await sql`
                    UPDATE menu_reactions 
                    SET dislike_count = dislike_count + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                `;
            }
        } else {
            // Switching reaction
            await sql`
                UPDATE user_reactions 
                SET action = ${action}, created_at = CURRENT_TIMESTAMP
                WHERE user_id = ${userId} AND menu_date = ${menuDate}
            `;
            // Decrement old, increment new
            if (previousAction === 'like') {
                await sql`
                    UPDATE menu_reactions 
                    SET like_count = GREATEST(like_count - 1, 0), 
                        dislike_count = dislike_count + 1, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                `;
            } else {
                await sql`
                    UPDATE menu_reactions 
                    SET dislike_count = GREATEST(dislike_count - 1, 0), 
                        like_count = like_count + 1, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                `;
            }
        }

        // Return updated counters + user action
        const result = await sql`
            SELECT like_count, dislike_count 
            FROM menu_reactions 
            WHERE menu_date = ${menuDate}
        `;

        const newUserAction = previousAction === action ? null : action;

        return NextResponse.json({
            likeCount: result[0].like_count,
            dislikeCount: result[0].dislike_count,
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
