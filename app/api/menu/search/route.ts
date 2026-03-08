import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { MenuData } from '@/lib/types';
import { parseScrapeDate } from '@/lib/date-utils';

export const revalidate = 0; // Her istekte taze veri — cache devre dışı

interface MealSearchResult {
    name: string;
    calories: number;
    category: string;
    dates: Array<{ date: string; dayName: string }>;
}

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'public', 'data');

        if (!fs.existsSync(dataDir)) {
            return NextResponse.json({ meals: [] });
        }

        // Düz yapıdaki tüm menu JSON dosyalarını bul
        const allFiles = fs.readdirSync(dataDir)
            .filter(file => file.startsWith('menu-') && file.endsWith('.json'));

        // Her ay (YYYY-MM) için en güncel dosyayı bul
        const monthLatest = new Map<string, { file: string; scrapeDate: number }>();

        for (const file of allFiles) {
            const monthMatch = file.match(/^menu-(\d{4}-\d{2})-/);
            if (!monthMatch) continue;

            const month = monthMatch[1];
            const scrapeDate = parseInt(parseScrapeDate(file) || '00000000');

            const existing = monthLatest.get(month);
            if (!existing || scrapeDate > existing.scrapeDate) {
                monthLatest.set(month, { file, scrapeDate });
            }
        }

        const mealMap = new Map<string, MealSearchResult>();

        for (const [, { file }] of monthLatest) {
            const filePath = path.join(dataDir, file);

            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const menuData: MenuData = JSON.parse(content);

                for (const day of menuData.days) {
                    if (!day.hasData) continue;

                    for (const meal of day.meals) {
                        const key = meal.name.toLowerCase().trim();

                        if (mealMap.has(key)) {
                            const existing = mealMap.get(key)!;
                            // Aynı tarihi tekrar ekleme
                            if (!existing.dates.some(d => d.date === day.date)) {
                                existing.dates.push({ date: day.date, dayName: day.dayName });
                            }
                        } else {
                            mealMap.set(key, {
                                name: meal.name,
                                calories: meal.calories,
                                category: meal.category,
                                dates: [{ date: day.date, dayName: day.dayName }],
                            });
                        }
                    }
                }
            } catch {
                continue;
            }
        }

        // Tarihlere göre sırala (en yeni en üstte)
        const meals = Array.from(mealMap.values()).map(meal => ({
            ...meal,
            dates: meal.dates.sort((a, b) => b.date.localeCompare(a.date)),
        }));

        return NextResponse.json({ meals });
    } catch {
        return NextResponse.json({ meals: [] }, { status: 500 });
    }
}
