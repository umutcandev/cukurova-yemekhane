import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─────────────────────────────────────────────────────────────────────────────
// Upstash Redis (opsiyonel)
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN tanımlıysa Redis kullanılır.
// Yoksa in-memory fallback devreye girer (single-instance / Coolify standalone).
// ─────────────────────────────────────────────────────────────────────────────

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
    if (redisClient) return redisClient;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
        redisClient = new Redis({ url, token });
    }
    return redisClient;
}

// Upstash Ratelimit instance'larını önbelleğe al (prefix + limit + window kombinasyonu başına)
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(prefix: string, maxRequests: number, windowMs: number): Ratelimit | null {
    const redis = getRedis();
    if (!redis) return null;
    const cacheKey = `${prefix}:${maxRequests}:${windowMs}`;
    if (!upstashLimiters.has(cacheKey)) {
        upstashLimiters.set(
            cacheKey,
            new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs / 1000} s`),
                prefix: `rl:${prefix}`,
            })
        );
    }
    return upstashLimiters.get(cacheKey)!;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fallback
// ─────────────────────────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 dakikalık pencere
const DEFAULT_MAX_REQUESTS = 10;
const MAX_STORE_SIZE = 10000;

function checkInMemory(
    key: string,
    maxRequests: number,
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // Süresi dolmuş kayıtları periyodik olarak temizle
    if (rateLimitStore.size > 500) {
        for (const [k, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) rateLimitStore.delete(k);
        }
    }

    // Hard limit: maksimum boyut aşılırsa en eski kayıtları temizle
    if (rateLimitStore.size >= MAX_STORE_SIZE) {
        const entries = [...rateLimitStore.entries()].sort((a, b) => a[1].resetTime - b[1].resetTime);
        for (const [k] of entries.slice(0, Math.floor(MAX_STORE_SIZE * 0.2))) {
            rateLimitStore.delete(k);
        }
    }

    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + WINDOW_MS });
        return { allowed: true, remaining: maxRequests - 1, resetIn: WINDOW_MS };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitOptions {
    prefix?: string;
    maxRequests?: number;
}

export async function checkRateLimit(
    identifier: string,
    options?: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const prefix = options?.prefix ?? "default";
    const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;

    const upstash = getUpstashLimiter(prefix, maxRequests, WINDOW_MS);
    if (upstash) {
        try {
            const { success, remaining, reset } = await upstash.limit(identifier);
            return {
                allowed: success,
                remaining,
                resetIn: Math.max(0, reset - Date.now()),
            };
        } catch (err) {
            // Redis hatası → in-memory'e düş, servisi kesmemek için
            console.error("[rate-limiter] Upstash error, falling back to in-memory:", err);
        }
    }

    return checkInMemory(`${prefix}:${identifier}`, maxRequests);
}

// Tarih formatı doğrulama (YYYY-MM-DD)
export function isValidDateFormat(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

// Periyodik temizlik — 5 dakikada bir (in-memory; Upstash kendi TTL'sini yönetir)
setInterval(() => {
    const now = Date.now();
    for (const [k, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) rateLimitStore.delete(k);
    }
}, 5 * 60 * 1000);
