import { NextRequest, NextResponse } from 'next/server';
import { getMealDetail } from '@/lib/meal-detail-cache';

/**
 * Önbellek lib/meal-detail-cache.ts'te (15 dk taze + son bilinen iyi kayıt).
 *
 * Burada bir `export const revalidate` YOK ve olmamalı: route dinamik
 * (params + NextRequest) olduğu için Next onu yok sayardı — eskiden duran
 * `revalidate = 86400` satırı hiçbir şey yapmıyor, sadece okuyanı yanıltıyordu.
 * Tazelik politikası tek yerde, önbellek modülünde.
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { detail, fetchedAt, stale } = await getMealDetail(id);

        // stale=true → veri son bilinen kayıttan geliyor; UI bunu etiketlemeli.
        return NextResponse.json({ ...detail, fetchedAt, stale });
    } catch (error) {
        console.error('Error scraping meal detail:', error);
        return NextResponse.json(
            { error: 'Failed to fetch meal detail' },
            { status: 500 }
        );
    }
}
