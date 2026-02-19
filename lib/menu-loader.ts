import fs from 'fs';
import path from 'path';
import type { MenuData, DayMenu } from './types';
import { parseScrapeDate } from './date-utils';

/**
 * Get the latest menu file for a given month from public/data/<month>/ folder.
 * @param month - Month in YYYY-MM format (e.g., "2026-02")
 * @returns Absolute file path of the latest menu file, or null if not found
 */
export function getLatestMenuFilePath(month: string): string | null {
    const monthDir = path.join(process.cwd(), 'public', 'data', month);

    if (!fs.existsSync(monthDir)) {
        return null;
    }

    const files = fs.readdirSync(monthDir)
        .filter(file => file.startsWith('menu-') && file.endsWith('.json'));

    if (files.length === 0) {
        return null;
    }

    // Extract scrape dates and find the latest
    const filesWithDates = files.map(file => {
        const dateStr = parseScrapeDate(file) || '00000000';
        return { file, date: parseInt(dateStr) };
    });

    const latest = filesWithDates.reduce((prev, current) =>
        current.date > prev.date ? current : prev
    );

    return path.join(monthDir, latest.file);
}

/**
 * Load menu data for a given month from public/data/<month>/ folder.
 * @param month - Month in YYYY-MM format (e.g., "2026-02")
 * @returns Menu data object
 * @throws Error if no menu file is found
 */
export async function loadMenuData(month: string): Promise<MenuData> {
    const filePath = getLatestMenuFilePath(month);

    if (!filePath) {
        throw new Error(`No menu data found for ${month}. Please run 'pnpm scrape' to generate data.`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const menuData: MenuData = JSON.parse(fileContent);

    return menuData;
}

/**
 * Search all month folders for a specific date's menu.
 * Used by the monthly-favorites drawer for past months.
 *
 * @param date - Date in YYYY-MM-DD format (e.g., "2026-01-15")
 * @returns The DayMenu for that date, or null if not found
 */
export function findMenuForDate(date: string): DayMenu | null {
    const dataDir = path.join(process.cwd(), 'public', 'data');

    if (!fs.existsSync(dataDir)) {
        return null;
    }

    // List all YYYY-MM subdirectories, sorted newest first for faster lookup
    const monthDirs = fs.readdirSync(dataDir)
        .filter(entry => {
            const fullPath = path.join(dataDir, entry);
            return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}$/.test(entry);
        })
        .sort((a, b) => b.localeCompare(a)); // newest first

    for (const monthDir of monthDirs) {
        const monthPath = path.join(dataDir, monthDir);

        // Get the latest JSON in this month folder
        const files = fs.readdirSync(monthPath)
            .filter(file => file.startsWith('menu-') && file.endsWith('.json'));

        if (files.length === 0) continue;

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
