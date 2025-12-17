/**
 * Date utility functions for menu application
 */

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayDate(): string {
    return getTurkeyDate();
}

/**
 * Get current date in Turkey (Europe/Istanbul) timezone
 */
export function getTurkeyDate(): string {
    const now = new Date();
    return new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
    const today = getTurkeyDate();
    const [year, month] = today.split('-');
    return `${year}-${month}`;
}

/**
 * Check if a date string is today
 */
export function isToday(date: string): boolean {
    return date === getTodayDate();
}

/**
 * Check if a date string is in the past
 */
export function isPast(date: string): boolean {
    const today = new Date(getTodayDate());
    const checkDate = new Date(date);
    return checkDate < today;
}

/**
 * Parse scrape date from filename
 * Example: menu-2025-12-20251213.json -> 20251213
 */
export function parseScrapeDate(filename: string): string | null {
    const match = filename.match(/menu-\d{4}-\d{2}-(\d{8})\.json/);
    return match ? match[1] : null;
}
