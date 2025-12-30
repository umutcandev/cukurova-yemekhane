import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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

        const result = await sql`
            SELECT like_count, dislike_count 
            FROM menu_reactions 
            WHERE menu_date = ${date}
        `;

        if (result.length === 0) {
            return NextResponse.json({ likeCount: 0, dislikeCount: 0 });
        }

        return NextResponse.json({
            likeCount: result[0].like_count,
            dislikeCount: result[0].dislike_count
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
        await sql`
            INSERT INTO menu_reactions (menu_date, like_count, dislike_count)
            VALUES (${menuDate}, 0, 0)
            ON CONFLICT (menu_date) DO NOTHING
        `;

        // Now update based on action
        let updateQuery;
        switch (action) {
            case 'like':
                updateQuery = sql`
                    UPDATE menu_reactions 
                    SET like_count = like_count + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                    RETURNING like_count, dislike_count
                `;
                break;
            case 'dislike':
                updateQuery = sql`
                    UPDATE menu_reactions 
                    SET dislike_count = dislike_count + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                    RETURNING like_count, dislike_count
                `;
                break;
            case 'removeLike':
                updateQuery = sql`
                    UPDATE menu_reactions 
                    SET like_count = GREATEST(like_count - 1, 0), updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                    RETURNING like_count, dislike_count
                `;
                break;
            case 'removeDislike':
                updateQuery = sql`
                    UPDATE menu_reactions 
                    SET dislike_count = GREATEST(dislike_count - 1, 0), updated_at = CURRENT_TIMESTAMP
                    WHERE menu_date = ${menuDate}
                    RETURNING like_count, dislike_count
                `;
                break;
        }

        const result = await updateQuery;

        if (!result || result.length === 0) {
            return NextResponse.json(
                { error: 'Failed to update reaction' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            likeCount: result[0].like_count,
            dislikeCount: result[0].dislike_count,
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
