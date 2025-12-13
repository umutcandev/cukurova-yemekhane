import fs from 'fs';
import path from 'path';
import type { MenuData } from './types';
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
