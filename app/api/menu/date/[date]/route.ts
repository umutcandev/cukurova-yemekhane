import { NextResponse } from 'next/server';
import { findMenuForDate } from '@/lib/menu-loader';

export const dynamic = 'force-dynamic';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ date: string }> }
) {
    const { date } = await params;

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    try {
        const day = findMenuForDate(date);

        if (!day) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({ found: true, day });
    } catch (error) {
        console.error('[menu/date] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
