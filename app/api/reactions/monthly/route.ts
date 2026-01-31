import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET /api/reactions/monthly?month=2026-01
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        // Validate month format (YYYY-MM)
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json(
                { error: 'Invalid month format. Use YYYY-MM' },
                { status: 400 }
            );
        }

        // Get all reactions for the specified month
        // menu_date format is YYYY-MM-DD, so we filter by prefix
        const result = await sql`
            SELECT menu_date, like_count, dislike_count 
            FROM menu_reactions 
            WHERE menu_date LIKE ${month + '%'}
            ORDER BY menu_date DESC
        `;

        if (result.length === 0) {
            return NextResponse.json({
                topLiked: [],
                topDisliked: [],
                month
            });
        }

        // Sort by like_count descending for top liked (only 5)
        const topLiked = [...result]
            .filter(r => r.like_count > 0)
            .sort((a, b) => b.like_count - a.like_count)
            .slice(0, 5)
            .map(r => ({
                date: r.menu_date,
                likeCount: r.like_count,
                dislikeCount: r.dislike_count
            }));

        // Sort by dislike_count descending for top disliked (only 5)
        const topDisliked = [...result]
            .filter(r => r.dislike_count > 0)
            .sort((a, b) => b.dislike_count - a.dislike_count)
            .slice(0, 5)
            .map(r => ({
                date: r.menu_date,
                likeCount: r.like_count,
                dislikeCount: r.dislike_count
            }));

        return NextResponse.json({
            topLiked,
            topDisliked,
            month
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
