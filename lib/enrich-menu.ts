import fs from 'fs';
import type { MenuData, Meal } from './types';
import { fetchMealDetail } from './meal-detail';
import { computeMealAllergens, normalizeIngredient } from './allergens';

/**
 * Menü verisini alerjen bilgisiyle zenginleştirir.
 *
 * Neden build-time: runtime'da (modal açılınca) canlı scrape yapmak alerjen
 * için kabul edilemez — site yavaş/kapalıysa uyarı görünmez ve kullanıcı
 * yemeği güvenli sanar. Uyarı, menüyle birlikte hazır gelmek zorunda.
 */

export interface EnrichmentReport {
    /** Menüdeki benzersiz yemek ID sayısı */
    uniqueMeals: number;
    /** Malzeme listesi çekilip etiketlenen yemek sayısı */
    enriched: number;
    /** Detay sayfası çekilemeyen ID'ler */
    failed: string[];
    /** Detay sayfası boş dönen ID'ler (placeholder kayıtlar: "BOŞ", "Meyve") */
    withoutIngredients: string[];
    /** Sözlükte bulunmayan malzeme → onu içeren yemek adları */
    unknownIngredients: Map<string, string[]>;
}

export interface EnrichOptions {
    /** Eşzamanlı istek sayısı — üniversite sunucusuna nazik davran */
    concurrency?: number;
    /** Partiler arası bekleme (ms) */
    delayMs?: number;
    /** Tek istek zaman aşımı (ms) */
    timeoutMs?: number;
    log?: (message: string) => void;
}

const DEFAULTS = {
    concurrency: 3,
    delayMs: 150,
    timeoutMs: 20000,
} as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Menüdeki benzersiz yemek ID'lerini, adlarıyla birlikte çıkarır. */
function collectUniqueMeals(menuData: MenuData): Map<string, string> {
    const ids = new Map<string, string>();
    for (const day of menuData.days) {
        for (const meal of day.meals ?? []) {
            if (!ids.has(meal.id)) ids.set(meal.id, meal.name);
        }
    }
    return ids;
}

/** Aynı ID'ye sahip TÜM Meal nesnelerini bulur (bir yemek birçok günde geçer). */
function collectMealRefs(menuData: MenuData): Map<string, Meal[]> {
    const refs = new Map<string, Meal[]>();
    for (const day of menuData.days) {
        for (const meal of day.meals ?? []) {
            const list = refs.get(meal.id);
            if (list) list.push(meal);
            else refs.set(meal.id, [meal]);
        }
    }
    return refs;
}

async function fetchWithRetry(id: string, timeoutMs: number) {
    try {
        return await fetchMealDetail(id, { signal: AbortSignal.timeout(timeoutMs) });
    } catch {
        // Tek deneme yetmez: geçici ağ hatası yüzünden alerjen bilgisi
        // düşmemeli. İkinci denemede de başarısızsa enrichmentFailed işaretlenir.
        await sleep(500);
        return await fetchMealDetail(id, { signal: AbortSignal.timeout(timeoutMs) });
    }
}

/**
 * menuData'yı YERİNDE zenginleştirir ve rapor döndürür.
 *
 * Kısmi başarısızlık kabul edilir, sessiz başarısızlık edilmez:
 * çekilemeyen yemek `enrichmentFailed: true` alır, tüm scrape düşürülmez.
 */
export async function enrichMenuData(
    menuData: MenuData,
    options: EnrichOptions = {}
): Promise<EnrichmentReport> {
    const { concurrency, delayMs, timeoutMs } = { ...DEFAULTS, ...options };
    const log = options.log ?? console.log;

    const uniqueMeals = collectUniqueMeals(menuData);
    const mealRefs = collectMealRefs(menuData);
    const ids = [...uniqueMeals.keys()];

    const report: EnrichmentReport = {
        uniqueMeals: ids.length,
        enriched: 0,
        failed: [],
        withoutIngredients: [],
        unknownIngredients: new Map(),
    };

    log(`🧪 Alerjen zenginleştirmesi: ${ids.length} benzersiz yemek`);

    const enrichedAt = new Date().toISOString();

    for (let i = 0; i < ids.length; i += concurrency) {
        const batch = ids.slice(i, i + concurrency);

        await Promise.all(
            batch.map(async (id) => {
                const targets = mealRefs.get(id) ?? [];

                let detail;
                try {
                    detail = await fetchWithRetry(id, timeoutMs);
                } catch {
                    report.failed.push(id);
                    for (const meal of targets) {
                        meal.enrichmentFailed = true;
                        meal.enrichedAt = enrichedAt;
                    }
                    return;
                }

                const names = detail.ingredients.map((ing) => ing.name);

                if (names.length === 0) {
                    // "BOŞ" / "Meyve" gibi placeholder kayıtlar. Detay sayfası
                    // çekildi ama reçete yok — başarısızlık değil, veri yokluğu.
                    report.withoutIngredients.push(id);
                }

                const { allergens, unmapped, dietFlags } = computeMealAllergens(names);

                for (const token of unmapped) {
                    const seen = report.unknownIngredients.get(token) ?? [];
                    const mealName = uniqueMeals.get(id) ?? `#${id}`;
                    if (!seen.includes(mealName)) seen.push(mealName);
                    report.unknownIngredients.set(token, seen);
                }

                for (const meal of targets) {
                    // Malzeme listesi BİLEREK JSON'a yazılmaz: modal onu her
                    // açılışta canlı çeker (reçete ID sabitken değişebiliyor,
                    // bkz. K3) ve kopyası dosya boyutunu ~2 katına çıkarıyordu.
                    // Uyarının sebebini göstermek için allergens[].from yeterli.
                    meal.allergens = allergens;
                    meal.unmappedIngredients = unmapped;
                    meal.dietFlags = dietFlags;
                    meal.enrichedAt = enrichedAt;
                    delete meal.enrichmentFailed;
                }

                report.enriched++;
            })
        );

        if (i + concurrency < ids.length) await sleep(delayMs);
    }

    return report;
}

/**
 * Raporu insan okunur biçimde basar.
 *
 * ALERJENPLANI 6.3: bilinmeyen token'lar SESSİZCE geçilemez. Bu çıktı
 * workflow'da uyarıya dönüşür — sözlük canlı tutulmadan özellik güvenilir
 * değildir.
 */
export function printEnrichmentReport(
    report: EnrichmentReport,
    log: (message: string) => void = console.log
): void {
    log('');
    log('🧪 Alerjen zenginleştirme raporu:');
    log(`   - Benzersiz yemek: ${report.uniqueMeals}`);
    log(`   - Etiketlenen: ${report.enriched}`);
    log(`   - Malzeme listesi boş: ${report.withoutIngredients.length}` +
        (report.withoutIngredients.length
            ? ` (id: ${report.withoutIngredients.join(', ')})`
            : ''));
    log(`   - Çekilemeyen: ${report.failed.length}` +
        (report.failed.length ? ` (id: ${report.failed.join(', ')})` : ''));

    if (report.unknownIngredients.size === 0) {
        log('   - Bilinmeyen malzeme: yok ✅');
        return;
    }

    log('');
    log(`⚠️  SÖZLÜKTE OLMAYAN ${report.unknownIngredients.size} MALZEME BULUNDU`);
    log('   Bu malzemeleri içeren yemekler "eksik veri" olarak işaretlendi.');
    log('   lib/allergens.ts sözlüğüne eklenmeden alerjen bilgisi eksiktir:');
    for (const [token, meals] of report.unknownIngredients) {
        log(`   - ${token}  →  ${meals.join(', ')}`);
    }
}

/** Normalize edilmiş bilinmeyen token listesi (workflow anotasyonu için). */
export function unknownTokenList(report: EnrichmentReport): string[] {
    return [...report.unknownIngredients.keys()].map(normalizeIngredient);
}

/**
 * GitHub Actions içindeysek bilinmeyen malzemeleri görünür sinyale çevirir:
 * workflow anotasyonu + job özeti.
 *
 * Exit code 0 bırakılır — menü scrape'i alerjen sözlüğü eskidiği için
 * düşürülmez; ama repo sahibi bunu görmeden geçemez (ALERJENPLANI 6.3/R2).
 */
export function emitCIAnnotations(report: EnrichmentReport): void {
    if (!process.env.GITHUB_ACTIONS) return;

    const tokens = [...report.unknownIngredients.entries()];
    if (tokens.length === 0) return;

    for (const [token, meals] of tokens) {
        console.log(
            `::warning title=Sözlükte olmayan malzeme::${token} — geçtiği yemekler: ${meals.join(', ')}`
        );
    }

    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) return;

    const lines = [
        '### ⚠️ Alerjen sözlüğü eksik',
        '',
        `Yemekhane, \`lib/allergens.ts\` sözlüğünde bulunmayan **${tokens.length}** malzeme kullanıyor.`,
        'Bu malzemeleri içeren yemekler "eksik veri" olarak işaretlendi; alerjen bilgileri güvenilir değil.',
        '',
        '| Malzeme | Geçtiği yemekler |',
        '| --- | --- |',
        ...tokens.map(([token, meals]) => `| \`${token}\` | ${meals.join(', ')} |`),
        '',
    ];

    try {
        fs.appendFileSync(summaryPath, lines.join('\n'), 'utf-8');
    } catch {
        // Özet yazılamadıysa anotasyonlar zaten basıldı.
    }
}
