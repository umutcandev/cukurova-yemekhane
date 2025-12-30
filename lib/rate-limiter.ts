// In-memory rate limit store
// Note: This resets on server restart. For production, consider using Redis.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10; // 10 requests per window

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 1000) {
        for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }

    if (!record || now > record.resetTime) {
        // New window
        rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return { allowed: true, remaining: MAX_REQUESTS - 1, resetIn: WINDOW_MS };
    }

    if (record.count >= MAX_REQUESTS) {
        return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
    }

    record.count++;
    return { allowed: true, remaining: MAX_REQUESTS - record.count, resetIn: record.resetTime - now };
}

// Validate date format (YYYY-MM-DD)
export function isValidDateFormat(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
}
