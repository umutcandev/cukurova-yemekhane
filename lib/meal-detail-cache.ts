import { Redis } from "@upstash/redis";
import { fetchMealDetail } from "./meal-detail";
import type { MealDetail } from "./types";

/**
 * Yemek detayı için iki katmanlı önbellek.
 *
 * NEDEN KISA TTL: Yemekhane, yemek ID'sini değiştirmeden reçeteyi
 * güncelleyebiliyor (ALERJENPLANI K3). Bayat malzeme listesi bayat alerjen
 * uyarısı demek. Önbelleğin asıl kazancı gecikme değil (uçtan uca zaten
 * ~100–200ms), öğle arasındaki ani istek dalgasını üniversitenin sunucusundan
 * uzak tutmak. 15 dakika o dalgayı 12 saat kadar iyi söndürür ama bayatlık
 * penceresini bir öğle arasının altında tutar.
 *
 * NEDEN İKİNCİ KATMAN: Üniversite sitesi kapandığında kullanıcıya hiçbir şey
 * gösterememek yerine son bilinen veriyi gösteriyoruz — ama `stale: true`
 * ile ETİKETLİ. Ürün sözleşmesi bayat veriyi taze gibi göstermeyi yasaklıyor.
 *
 * NOT: Alerjenler burada saklanmaz. Onlar malzeme listesinin türevi ve
 * `computeMealAllergens` ile her render'da yeniden hesaplanıyor; sözlük
 * (lib/allergens.ts) deploy'la geldiği için sözlük güncellemesi önbelleği
 * bayatlatmaz.
 */

/** Bu süre içinde önbellekten servis edilir, upstream'e gidilmez. */
const FRESH_MS = 15 * 60 * 1000;

/** Son bilinen iyi kayıt bu kadar tutulur; yalnızca upstream düşerse okunur. */
const KEEP_SECONDS = 7 * 24 * 60 * 60;

const FETCH_TIMEOUT_MS = 15000;

const KEY_PREFIX = "meal-detail:";

interface CachedEntry {
    detail: MealDetail;
    /** epoch ms */
    fetchedAt: number;
}

export interface MealDetailResult {
    detail: MealDetail;
    /** Veri üniversiteden ne zaman çekildi (ISO) */
    fetchedAt: string;
    /** true = upstream'e ulaşılamadı, son bilinen veri döndü */
    stale: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Depolama: Upstash varsa Redis, yoksa in-memory (tek instance / Coolify)
// lib/rate-limiter.ts ile aynı desen.
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

const memoryStore = new Map<string, CachedEntry>();
const MEMORY_MAX = 500; // katalog ~250 yemek; fazlası olmamalı

function readMemory(id: string): CachedEntry | null {
    const entry = memoryStore.get(id);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > KEEP_SECONDS * 1000) {
        memoryStore.delete(id);
        return null;
    }
    return entry;
}

function writeMemory(id: string, entry: CachedEntry): void {
    if (memoryStore.size >= MEMORY_MAX) {
        // En eski kaydı düşür
        let oldestKey: string | null = null;
        let oldestAt = Infinity;
        for (const [key, value] of memoryStore) {
            if (value.fetchedAt < oldestAt) {
                oldestAt = value.fetchedAt;
                oldestKey = key;
            }
        }
        if (oldestKey) memoryStore.delete(oldestKey);
    }
    memoryStore.set(id, entry);
}

async function readCache(id: string): Promise<CachedEntry | null> {
    const redis = getRedis();
    if (!redis) return readMemory(id);

    try {
        const entry = await redis.get<CachedEntry>(`${KEY_PREFIX}${id}`);
        // Bozuk / eski şekilli kaydı yok say
        if (!entry || typeof entry.fetchedAt !== "number" || !entry.detail) {
            return null;
        }
        return entry;
    } catch (error) {
        // Redis erişilemiyorsa özellik çalışmaya devam etmeli.
        console.error("meal-detail cache read failed:", error);
        return readMemory(id);
    }
}

async function writeCache(id: string, entry: CachedEntry): Promise<void> {
    const redis = getRedis();
    if (!redis) {
        writeMemory(id, entry);
        return;
    }

    try {
        await redis.set(`${KEY_PREFIX}${id}`, entry, { ex: KEEP_SECONDS });
    } catch (error) {
        console.error("meal-detail cache write failed:", error);
        writeMemory(id, entry);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Yemek detayını önbellekten ya da üniversitenin sitesinden getirir.
 *
 * Sıra: taze önbellek → upstream → son bilinen iyi (etiketli).
 * Üçü de yoksa hata fırlatır; çağıran taraf bunu "bilgi yok" olarak
 * göstermeli, asla "alerjen yok" olarak değil.
 */
export async function getMealDetail(id: string): Promise<MealDetailResult> {
    const cached = await readCache(id);
    const now = Date.now();

    if (cached && now - cached.fetchedAt < FRESH_MS) {
        return {
            detail: cached.detail,
            fetchedAt: new Date(cached.fetchedAt).toISOString(),
            stale: false,
        };
    }

    try {
        const detail = await fetchMealDetail(id, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        await writeCache(id, { detail, fetchedAt: now });
        return { detail, fetchedAt: new Date(now).toISOString(), stale: false };
    } catch (error) {
        if (cached) {
            // Site kapalı ama elimizde son bilinen veri var. Göstermek
            // göstermemekten iyi — yeter ki bayat olduğu söylensin.
            console.error(`meal-detail upstream failed for id=${id}, serving stale:`, error);
            return {
                detail: cached.detail,
                fetchedAt: new Date(cached.fetchedAt).toISOString(),
                stale: true,
            };
        }
        throw error;
    }
}
