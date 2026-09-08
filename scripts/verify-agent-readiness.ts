/**
 * Ajan/arama motoru hazırlığının kabul kriterleri.
 *
 * Repoda test altyapısı yok; verify-allergens.ts gibi bu script onun yerini
 * tutar. İki modu var:
 *
 *   pnpm verify-agent            → saf fonksiyonlar (Accept pazarlığı, markdown)
 *   pnpm verify-agent --url=...  → ayrıca canlı uçları doğrular
 *
 * Örnek: pnpm verify-agent --url=http://localhost:3000
 */
import { prefersMarkdown } from '../lib/accept-markdown.js';
import { formatContentPageMarkdown, formatDayMarkdown, formatMenuMarkdown } from '../lib/agent-content.js';
import { aboutPage } from '../lib/content/about.js';
import { privacyPage } from '../lib/content/privacy.js';
import { formatNotFoundMarkdown } from '../lib/markdown-response.js';
import {
    INDEXABLE_ROUTES,
    LOGIN_REQUIRED_ROUTES,
    SITE_TITLE,
    hasMarkdownRendition,
    normalizePath,
} from '../lib/site.js';
import type { DayMenu } from '../lib/types.js';

let passed = 0;
const failures: string[] = [];

/** "Accept-Encoding" içinde "accept" geçtiği için substring kontrolü yetmiyor. */
function varyHasAccept(header: string | null): boolean {
    return (header ?? '')
        .split(',')
        .some((token) => token.trim().toLowerCase() === 'accept');
}

/**
 * Bir sayfanın markdown pazarlığı CDN arkasında da çalışır mı?
 *
 * İki yoldan biri yeterli: yanıt `Vary: Accept` taşır, ya da paylaşımlı
 * önbelleğe hiç girmez. Next 16 page route'larında Vary'yi kendi RSC
 * değerleriyle ezdiği için pratikte ikinci yol işliyor (bkz. next.config.mjs).
 */
function safeForSharedCache(response: Response): boolean {
    if (varyHasAccept(response.headers.get('vary'))) return true;

    const cacheControl = (response.headers.get('cache-control') ?? '').toLowerCase();
    return /no-store|private|s-maxage=0/.test(cacheControl);
}

/** Sayfanın canonical'ının işaret ettiği yol; tag yoksa null. */
function canonicalPath(html: string): string | null {
    const match = html.match(/rel="canonical" href="([^"]+)"/);
    if (!match) return null;
    return normalizePath(new URL(match[1], 'https://example.invalid').pathname);
}

function check(name: string, condition: boolean, detail?: string) {
    if (condition) {
        passed++;
        console.log(`  ✅ ${name}`);
    } else {
        failures.push(detail ? `${name} — ${detail}` : name);
        console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

function equal<T>(name: string, actual: T, expected: T) {
    check(name, actual === expected, `beklenen ${JSON.stringify(expected)}, gelen ${JSON.stringify(actual)}`);
}

// ─── Accept pazarlığı ────────────────────────────────────────────────────────

console.log('\nAccept: text/markdown pazarlığı');

equal('düz markdown isteği', prefersMarkdown('text/markdown'), true);
equal('markdown + charset', prefersMarkdown('text/markdown;charset=utf-8'), true);
equal('markdown öncelikli liste', prefersMarkdown('text/markdown,text/html;q=0.5'), true);
equal('x-markdown eşanlamlısı', prefersMarkdown('text/x-markdown'), true);
equal('boşluklu liste', prefersMarkdown('text/plain, text/markdown'), true);

// Tarayıcı istekleri HTML almaya devam etmeli — regresyon olursa site bozulur.
equal(
    'Chrome Accept başlığı',
    prefersMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'),
    false
);
equal('curl varsayılanı (*/*)', prefersMarkdown('*/*'), false);
equal('boş başlık', prefersMarkdown(null), false);
equal('HTML daha yüksek q', prefersMarkdown('text/html,text/markdown;q=0.1'), false);
equal('eşit q → HTML kazanır', prefersMarkdown('text/html;q=0.9,text/markdown;q=0.9'), false);
equal('q=0 markdown', prefersMarkdown('text/markdown;q=0'), false);

// ─── Yol eşlemesi ────────────────────────────────────────────────────────────

console.log('\nMarkdown karşılığı olan yollar');

equal('ana sayfa', hasMarkdownRendition('/'), true);
equal('sondaki eğik çizgi', hasMarkdownRendition('/hakkinda/'), true);
equal('gizlilik', hasMarkdownRendition('/gizlilik'), true);
equal('girişe bağlı sayfa', hasMarkdownRendition('/favorilerim'), true);
equal('bilinmeyen yol', hasMarkdownRendition('/yok-boyle-bir-sey'), false);
equal('yol öneki eşleşmesin', hasMarkdownRendition('/hakkinda-degil'), false);
equal('alt yol eşleşmesin', hasMarkdownRendition('/hakkinda/alt'), false);
equal('normalizePath boş', normalizePath(''), '/');
equal('normalizePath çoklu çizgi', normalizePath('/gizlilik///'), '/gizlilik');

check('404 markdown gövdesinde llms.txt', formatNotFoundMarkdown().includes('/llms.txt'));
check('404 markdown gövdesinde sitemap', formatNotFoundMarkdown().includes('/sitemap.xml'));
check('404 markdown H1', formatNotFoundMarkdown().startsWith('# 404'));

// ─── Menü markdown çıktısı ───────────────────────────────────────────────────

console.log('\nMenü markdown çıktısı');

const sampleDay: DayMenu = {
    ymk: 1,
    date: '2026-09-08',
    dayName: 'Pazartesi',
    hasData: true,
    totalCalories: 797,
    meals: [
        {
            id: '157',
            name: 'EKŞİLİ KÖFTE',
            calories: 294,
            category: 'ana_yemek',
            allergens: [
                { id: 'gluten', confidence: 'kesin', from: ['UN'] },
                { id: 'soya', confidence: 'muhtemel', from: ['MARGARİN'] },
            ],
        },
        { id: '158', name: 'PİRİNÇ PİLAVI', calories: 503, category: 'yan_yemek' },
    ],
};

const emptyDay: DayMenu = {
    ymk: 2,
    date: '2026-09-13',
    dayName: 'Cumartesi',
    hasData: false,
    totalCalories: 0,
    meals: [],
};

const dayMarkdown = formatDayMarkdown(sampleDay);

check('gün başlığı H2', dayMarkdown.startsWith('## '), dayMarkdown.slice(0, 40));
check('tarih Türkçe yazılmış', dayMarkdown.includes('8 Eylül 2026'), dayMarkdown.slice(0, 60));
check('yemek adı title case', dayMarkdown.includes('Ekşili Köfte'), 'başlık biçimi bozuk');
check('kalori satırı', dayMarkdown.includes('| 294 kcal |'));
check('toplam kalori', dayMarkdown.includes('Toplam: 797 kcal'));
check('alerjen etiketi', dayMarkdown.includes('Gluten'), 'gluten etiketi yok');
check('muhtemel alerjen işaretli', dayMarkdown.includes('Soya (içerebilir)'));
check(
    'alerjen sorumluluk notu',
    dayMarkdown.includes('içermediği anlamına gelmez'),
    'güvenlik notu düşmüş — alerjen çıktısı yanlış okunabilir'
);
check(
    'malzeme listesi sızmıyor',
    !dayMarkdown.includes('UN') && !dayMarkdown.includes('MARGARİN'),
    'malzemeler önbelleğe alınmamalı'
);

const emptyMarkdown = formatDayMarkdown(emptyDay);
check('verisiz gün açıklanıyor', emptyMarkdown.includes('menü yok'), emptyMarkdown);

const menuMarkdown = formatMenuMarkdown([sampleDay, emptyDay], '2026-09-08');
check('H1 var', menuMarkdown.startsWith('# '), menuMarkdown.slice(0, 40));
check('bugünün menüsü bölümü', menuMarkdown.includes('# Bugünün menüsü'));
check('sonraki günler bölümü', menuMarkdown.includes('# Sonraki günler'));
check('llms.txt bağlantısı', menuMarkdown.includes('/llms.txt'));
check('500 karakterden uzun', menuMarkdown.length > 500, `${menuMarkdown.length} karakter`);

const missingToday = formatMenuMarkdown([sampleDay], '2026-09-10');
check('bugün verisi yoksa da üretiliyor', missingToday.includes('menü verisi bulunmuyor'), missingToday.slice(0, 200));

// ─── Metin sayfaları ─────────────────────────────────────────────────────────

console.log('\nGüven sayfaları (about / privacy)');

for (const page of [aboutPage, privacyPage]) {
    const markdown = formatContentPageMarkdown(page);
    const textLength = page.intro.length + page.sections.reduce(
        (total, section) =>
            total +
            section.heading.length +
            (section.paragraphs?.join('').length ?? 0) +
            (section.bullets?.join('').length ?? 0),
        0
    );

    check(`${page.path} 500+ karakter içerik`, textLength >= 500, `${textLength} karakter`);
    check(`${page.path} markdown H1`, markdown.startsWith(`# ${page.title}`));
    check(`${page.path} tüm bölümler H2`, page.sections.every((s) => markdown.includes(`## ${s.heading}`)));
    check(`${page.path} description dolu`, page.description.length > 50);
    check(
        `${page.path} göreli bağlantılar mutlaklaştırılmış`,
        !/\]\(\/(?!\/)/.test(markdown),
        'markdown içinde göreli bağlantı kaldı'
    );
    check(
        `${page.path} sitemap'te listeli`,
        INDEXABLE_ROUTES.some((route) => route.path === page.path)
    );
}

// ─── Canlı uçlar (opsiyonel) ─────────────────────────────────────────────────

const urlArg = process.argv.find((arg) => arg.startsWith('--url='));

async function verifyLive(baseUrl: string) {
    console.log(`\nCanlı uçlar — ${baseUrl}`);

    const get = (path: string, headers?: Record<string, string>) =>
        fetch(new URL(path, baseUrl), { headers, redirect: 'manual' });

    // 1. Ana sayfa ham HTML'i: H1 + menü içeriği
    const home = await get('/');
    equal('/ 200 döner', home.status, 200);
    const html = await home.text();
    check('/ içinde <h1> var', /<h1[\s>]/.test(html), 'H1 bulunamadı');
    check('/ canonical link var', /rel="canonical"/.test(html));
    check('/ og:image var', /property="og:image"/.test(html));
    check('/ og:type var', /property="og:type"/.test(html));
    check('/ lang="tr"', /<html[^>]+lang="tr"/.test(html));
    check('/ JSON-LD var', html.includes('application/ld+json'));
    // Yasal sayfalara giden bağlantılar footer'da; ham HTML'den düşmemeli.
    check('/ ham HTML\'de /hakkinda bağlantısı', html.includes('href="/hakkinda"'));
    check('/ ham HTML\'de /gizlilik bağlantısı', html.includes('href="/gizlilik"'));
    check('/ og:image mutlak adres', /property="og:image" content="https?:/.test(html));
    const textOnly = html
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<style[\s\S]*?<\/style>/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    check('/ 500+ karakter metin içeriği', textOnly.length >= 500, `${textOnly.length} karakter`);
    check(
        '/ CDN yanlış varyantı servis edemez',
        safeForSharedCache(home),
        `vary: ${home.headers.get('vary') ?? '(yok)'} | cache-control: ${home.headers.get('cache-control') ?? '(yok)'}`
    );

    // 2. Markdown pazarlığı — her yol kendi gövdesini döndürmeli
    const markdown = await get('/', { Accept: 'text/markdown' });
    equal('/ markdown 200', markdown.status, 200);
    check(
        '/ markdown content-type',
        (markdown.headers.get('content-type') ?? '').startsWith('text/markdown'),
        markdown.headers.get('content-type') ?? '(yok)'
    );
    check(
        '/ markdown Vary: Accept',
        varyHasAccept(markdown.headers.get('vary')),
        markdown.headers.get('vary') ?? '(yok)'
    );
    const markdownBody = await markdown.text();
    check('/ markdown gövdesi menü başlığıyla başlıyor', markdownBody.startsWith(`# ${SITE_TITLE}`), markdownBody.slice(0, 60));

    /*
     * Yol eşlemesinin gerçekten çalıştığı burada anlaşılıyor: yol route
     * handler'a ulaşmazsa her istek ana sayfa menüsünü döndürür.
     */
    for (const page of [aboutPage, privacyPage]) {
        const response = await get(page.path, { Accept: 'text/markdown' });
        equal(`${page.path} markdown 200`, response.status, 200);
        const body = await response.text();
        check(
            `${page.path} markdown gövdesi sayfaya ait`,
            body.startsWith(`# ${page.title}`),
            body.slice(0, 60)
        );
    }

    for (const route of LOGIN_REQUIRED_ROUTES) {
        const response = await get(route.path, { Accept: 'text/markdown' });
        const body = await response.text();
        check(
            `${route.path} markdown giriş notu döndürüyor`,
            body.startsWith(`# ${route.title}`) && body.includes('giriş yapmayı gerektirir'),
            body.slice(0, 60)
        );
    }

    // 3. Gerçek 404 + kurtarma gövdesi
    const missing = await get('/bulunmayan-bir-yol-42');
    equal('bilinmeyen yol 404', missing.status, 404);
    const missingBody = await missing.text();
    check('404 gövdesinde llms.txt', missingBody.includes('/llms.txt'));
    check('404 gövdesinde sitemap', missingBody.includes('/sitemap.xml'));

    const missingMarkdown = await get('/bulunmayan-bir-yol-42', { Accept: 'text/markdown' });
    equal('bilinmeyen yol markdown 404', missingMarkdown.status, 404);
    check(
        '404 markdown content-type',
        (missingMarkdown.headers.get('content-type') ?? '').startsWith('text/markdown'),
        missingMarkdown.headers.get('content-type') ?? '(yok)'
    );

    // 4. Makine okunur dosyalar
    const llms = await get('/llms.txt');
    equal('/llms.txt 200', llms.status, 200);
    const llmsBody = await llms.text();
    check('/llms.txt "ne zaman kullanmalısın" bölümü', llmsBody.includes('Bu siteyi ne zaman kullanmalısın'));
    check('/llms.txt uygun olmayan kullanımlar', llmsBody.includes('uygun DEĞİL'));
    check('/llms.txt çağrı talimatı', llmsBody.includes('Accept: text/markdown'));
    check('/llms.txt API yolu', llmsBody.includes('/api/menu/date/'));

    const sitemap = await get('/sitemap.xml');
    equal('/sitemap.xml 200', sitemap.status, 200);
    const sitemapBody = await sitemap.text();
    check('sitemap urlset', sitemapBody.includes('<urlset'));
    check('sitemap lastmod', sitemapBody.includes('<lastmod>'));
    const sitemapLocs = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
        normalizePath(new URL(match[1]).pathname)
    );
    for (const route of INDEXABLE_ROUTES) {
        check(`sitemap ${route.path} içeriyor`, sitemapLocs.includes(route.path), sitemapLocs.join(', '));
    }
    // Girişe bağlı sayfalar sitemap'te olmamalı; içerik kişiye özel.
    for (const route of LOGIN_REQUIRED_ROUTES) {
        check(`sitemap ${route.path} içermiyor`, !sitemapLocs.includes(route.path), sitemapLocs.join(', '));
    }

    const robots = await get('/robots.txt');
    equal('/robots.txt 200', robots.status, 200);
    const robotsBody = await robots.text();
    check('robots sitemap satırı', robotsBody.includes('Sitemap:'));
    check('robots Host protokolsüz', !/Host:\s*https?:/.test(robotsBody), robotsBody);
    for (const route of LOGIN_REQUIRED_ROUTES) {
        check(`robots ${route.path} disallow`, robotsBody.includes(`Disallow: ${route.path}`), robotsBody);
    }

    // 5. Güven sayfaları
    for (const page of [aboutPage, privacyPage]) {
        const response = await get(page.path);
        equal(`${page.path} 200`, response.status, 200);
        const body = await response.text();
        check(`${page.path} <h1> var`, /<h1[\s>]/.test(body));
        check(
            `${page.path} CDN yanlış varyantı servis edemez`,
            safeForSharedCache(response),
            `vary: ${response.headers.get('vary') ?? '(yok)'} | cache-control: ${response.headers.get('cache-control') ?? '(yok)'}`
        );
        equal(`${page.path} canonical kendini gösteriyor`, canonicalPath(body), page.path);
        // Next openGraph'ı merge etmiyor; sayfa kendi og:title'ını verince görsel düşerdi.
        check(`${page.path} og:image korunmuş`, /property="og:image"/.test(body));
        check(`${page.path} og:site_name korunmuş`, /property="og:site_name"/.test(body));
        check(
            `${page.path} twitter:title sayfaya ait`,
            body.includes(`name="twitter:title" content="${page.title}"`),
            'ana sayfanın başlığı kalmış olabilir'
        );
    }

    /*
     * canonical root layout'tan miras kalmamalı: girişe bağlı sayfalar ve 404
     * aksi halde kendini ana sayfanın kopyası ilan eder.
     */
    for (const route of LOGIN_REQUIRED_ROUTES) {
        const response = await get(route.path, { Cookie: '' });
        const body = await response.text();
        check(
            `${route.path} ana sayfayı canonical göstermiyor`,
            canonicalPath(body) !== '/',
            `canonical: ${canonicalPath(body) ?? '(yok)'}`
        );
    }
    check(
        '404 ana sayfayı canonical göstermiyor',
        canonicalPath(missingBody) !== '/',
        `canonical: ${canonicalPath(missingBody) ?? '(yok)'}`
    );
    check(
        '404 çelişen robots meta yok',
        !/name="robots" content="index/.test(missingBody),
        'noindex ile çelişen index tag\'i var'
    );
}

async function main() {
    if (urlArg) {
        try {
            await verifyLive(urlArg.slice('--url='.length));
        } catch (error) {
            failures.push(`canlı doğrulama çalıştırılamadı: ${error instanceof Error ? error.message : error}`);
        }
    } else {
        console.log('\nCanlı uçlar atlandı (--url=http://localhost:3000 ile çalıştır).');
    }

    console.log('\n───────────────────────────────────────────────────────────');
    if (failures.length === 0) {
        console.log(`✅ ${passed} kontrol geçti.\n`);
    } else {
        console.log(`❌ ${failures.length} kontrol BAŞARISIZ (${passed} geçti):\n`);
        failures.forEach((f) => console.log(`   - ${f}`));
        console.log('');
        process.exit(1);
    }
}

main();
