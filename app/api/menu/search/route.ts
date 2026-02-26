import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { MenuData } from '@/lib/types';
import { parseScrapeDate } from '@/lib/date-utils';

export const revalidate = 3600; // 1 saat cache

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

        // Tüm YYYY-MM klasörlerini bul
        const monthDirs = fs.readdirSync(dataDir)
            .filter(entry => {
                const fullPath = path.join(dataDir, entry);
                return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}$/.test(entry);
            })
            .sort((a, b) => a.localeCompare(b));

        const mealMap = new Map<string, MealSearchResult>();

        for (const monthDir of monthDirs) {
            const monthPath = path.join(dataDir, monthDir);

            const files = fs.readdirSync(monthPath)
                .filter(file => file.startsWith('menu-') && file.endsWith('.json'));

            if (files.length === 0) continue;

            // En güncel dosyayı bul
            const filesWithDates = files.map(file => ({
                file,
                date: parseInt(parseScrapeDate(file) || '00000000'),
            }));

            const latest = filesWithDates.reduce((prev, curr) =>
                curr.date > prev.date ? curr : prev
            );

            const filePath = path.join(monthPath, latest.file);

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
