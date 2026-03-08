/**
 * Date utility functions for menu application
 */

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
 * Parse scrape date from filename
 * Example: menu-2025-12-20251213.json -> 20251213
 */
export function parseScrapeDate(filename: string): string | null {
    const match = filename.match(/menu-\d{4}-\d{2}-(\d{8})\.json/);
    return match ? match[1] : null;
}

