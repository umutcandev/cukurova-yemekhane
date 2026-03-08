import fs from 'fs';
import path from 'path';
import type { MenuData, DayMenu } from './types';
import { parseScrapeDate } from './date-utils';

/**
 * Get the latest menu file for a given month
 * @param month - Month in YYYY-MM format (e.g., "2025-12")
 * @returns Filename of the latest menu file, or null if not found
 */
export function getLatestMenuFile(month: string): string | null {
    const dataDir = path.join(process.cwd(), 'public', 'data');

    // Check if directory exists
    if (!fs.existsSync(dataDir)) {
        return null;
    }

    // Find all menu files for the given month
    const files = fs.readdirSync(dataDir)
        .filter(file => file.startsWith(`menu-${month}-`) && file.endsWith('.json'));

    if (files.length === 0) {
        return null;
    }

    // Extract dates and find the latest
    const filesWithDates = files.map(file => {
        const dateStr = parseScrapeDate(file) || '00000000';
        return { file, date: parseInt(dateStr) };
    });

    // Sort by date descending and get the first (latest)
    const latest = filesWithDates.reduce((prev, current) =>
        current.date > prev.date ? current : prev
    );

    return latest.file;
}

/**
 * Load menu data for a given month
 * @param month - Month in YYYY-MM format (e.g., "2025-12")
 * @returns Menu data object
 * @throws Error if no menu file is found
 */
export async function loadMenuData(month: string): Promise<MenuData> {
    const filename = getLatestMenuFile(month);

    if (!filename) {
        throw new Error(`No menu data found for ${month}. Please run 'pnpm scrape' to generate data.`);
    }

    const filePath = path.join(process.cwd(), 'public', 'data', filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const menuData: MenuData = JSON.parse(fileContent);

    return menuData;
}

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
 * Load ALL available menu data across all months.
 * For each month, picks the latest scrape file and merges all days
 * into a single MenuData object sorted by date.
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

    // Her ay için en güncel dosyayı bul
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

    // Tüm ayların verilerini birleştir
    const allDays: DayMenu[] = [];
    let latestUpdated = '';
    let latestMonth = '';

    for (const [month, { file }] of monthLatest) {
        const filePath = path.join(dataDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const menuData: MenuData = JSON.parse(content);

            for (const day of menuData.days) {
                allDays.push(day);
            }

            if (month > latestMonth) {
                latestMonth = month;
                latestUpdated = menuData.lastUpdated;
            }
        } catch {
            continue;
        }
    }

    if (allDays.length === 0) {
        throw new Error('No menu data found. Please run \'pnpm scrape\' to generate data.');
    }

    // Tarihe göre sırala, duplikatları önle
    const seenDates = new Set<string>();
    const uniqueDays = allDays
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter(day => {
            if (seenDates.has(day.date)) return false;
            seenDates.add(day.date);
            return true;
        });

    return {
        month: latestMonth,
        lastUpdated: latestUpdated,
        scrapeDate: new Date().toISOString().split('T')[0],
        totalDays: uniqueDays.length,
        days: uniqueDays,
    };
}

