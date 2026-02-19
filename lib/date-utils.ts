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
    // Yeni format: menu-YYYYMMDD.json
    const newMatch = filename.match(/^menu-(\d{8})\.json$/);
    if (newMatch) return newMatch[1];
    // Eski format: menu-YYYY-MM-YYYYMMDD.json (geriye dönük uyumluluk)
    const oldMatch = filename.match(/menu-\d{4}-\d{2}-(\d{8})\.json/);
    return oldMatch ? oldMatch[1] : null;
}

/**
 * Get Turkish month name from date
 */
export function getTurkishMonthName(date?: Date): string {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const d = date || new Date();
    return months[d.getMonth()];
}
