// In-memory rate limit store
// Note: This resets on server restart. For production, consider using Redis.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const DEFAULT_MAX_REQUESTS = 10; // Default: 10 requests per window

interface RateLimitOptions {
    prefix?: string;
    maxRequests?: number;
}

export function checkRateLimit(
    identifier: string,
    options?: RateLimitOptions
): { allowed: boolean; remaining: number; resetIn: number } {
    const prefix = options?.prefix ?? "default";
    const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
    const key = `${prefix}:${identifier}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // Clean up expired entries periodically (lowered threshold for earlier cleanup)
    if (rateLimitStore.size > 500) {
        for (const [k, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(k);
            }
        }
    }

    if (!record || now > record.resetTime) {
        // New window
        rateLimitStore.set(key, { count: 1, resetTime: now + WINDOW_MS });
        return { allowed: true, remaining: maxRequests - 1, resetIn: WINDOW_MS };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
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

// Periodic cleanup every 5 minutes to prevent memory leaks
// This runs independently of the threshold-based cleanup in checkRateLimit
setInterval(() => {
    const now = Date.now();
    for (const [k, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(k);
        }
    }
}, 5 * 60 * 1000);
