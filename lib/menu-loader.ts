import fs from 'fs';
import path from 'path';
import type { MenuData, DayMenu } from './types';
import { parseScrapeDate } from './date-utils';

/**
 * Search all menu files for a specific date's menu.
 * Used by the /api/menu/date/:date endpoint.
 *
 * @param date - Date in YYYY-MM-DD format (e.g., "2026-01-15")
 * @returns The DayMenu for that date, or null if not found
 */
export function findMenuForDate(date: string): DayMenu | null {
    const dataDir = path.join(process.cwd(), 'public', 'data');

    if (!fs.existsSync(dataDir)) {
        return null;
    }

    // Find all menu JSON files, sorted newest first
    const files = fs.readdirSync(dataDir)
        .filter(file => file.startsWith('menu-') && file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // newest first

    for (const file of files) {
        const filePath = path.join(dataDir, file);

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const menuData: MenuData = JSON.parse(content);

            const found = menuData.days.find(day => day.date === date);
            if (found) {
                return found;
            }
        } catch {
            // Skip corrupt files
            continue;
        }
    }

    return null;
}

/**
 * Load ALL available menu data from data/ directory.
 * Reads all JSON files sorted by scrape date (oldest first),
 * merges all days using a Map — if the same date exists in multiple files,
 * the newer scrape overwrites the older one.
 */
export async function loadAllMenuData(): Promise<MenuData> {
    const dataDir = path.join(process.cwd(), 'public', 'data');

    if (!fs.existsSync(dataDir)) {
        throw new Error('No menu data found. Please run \'pnpm scrape\' to generate data.');
    }

    const allFiles = fs.readdirSync(dataDir)
        .filter(file => file.startsWith('menu-') && file.endsWith('.json'));

    if (allFiles.length === 0) {
        throw new Error('No menu data found. Please run \'pnpm scrape\' to generate data.');
    }

    // Dosyaları scrape tarihine göre eskiden yeniye sırala
    // parseScrapeDate YYYYMMDD formatında döndürür (ör. 20260130 < 20260201)
    const sortedFiles = allFiles
        .map(file => ({
            file,
            scrapeDate: parseInt(parseScrapeDate(file) || '0')
        }))
        .sort((a, b) => a.scrapeDate - b.scrapeDate);

    // Tüm dosyaları oku, aynı tarih varsa yeni scrape üzerine yazar
    const dayMap = new Map<string, DayMenu>();
    let latestUpdated = '';
    let latestMonth = '';

    for (const { file } of sortedFiles) {
        const filePath = path.join(dataDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const menuData: MenuData = JSON.parse(content);

            for (const day of menuData.days) {
                dayMap.set(day.date, day);
            }

            // En son okunan dosyanın meta bilgilerini kullan
            if (menuData.month > latestMonth) {
                latestMonth = menuData.month;
            }
            latestUpdated = menuData.lastUpdated;
        } catch {
            continue;
        }
    }

    if (dayMap.size === 0) {
        throw new Error('No menu data found. Please run \'pnpm scrape\' to generate data.');
    }

    // Map'ten tarihe göre sıralı unique günleri al
    const uniqueDays = [...dayMap.values()]
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        month: latestMonth,
        lastUpdated: latestUpdated,
        scrapeDate: new Date().toISOString().split('T')[0],
        totalDays: uniqueDays.length,
        days: uniqueDays,
    };
}


