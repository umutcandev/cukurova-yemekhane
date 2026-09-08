/**
 * Sitenin kimliğiyle ilgili sabitler. Metadata, JSON-LD, sitemap, llms.txt ve
 * markdown çıktıları aynı yerden beslensin diye tek dosyada toplandı.
 */

export const SITE_URL = process.env.APP_URL || "https://www.cukurova.app";

export const SITE_NAME = "Yemekhane";

export const SITE_TITLE = "Çukurova Üniversitesi Yemekhane";

export const SITE_DESCRIPTION =
    "Çukurova Üniversitesi Merkezi Kafeterya'nın günlük yemek menüsü: yemekler, kalori değerleri, alerjen uyarıları, favori bildirimleri ve kalori takibi.";

export const REPO_URL = "https://github.com/umutcandev/cukurova-yemekhane";

export const UPSTREAM_URL = "https://yemekhane.cu.edu.tr/";

/** Sitede zaten yayımlanan iletişim adresi (bkz. components/mobile-menu.tsx). */
export const CONTACT_EMAIL = "hi@umutcan.dev";

/**
 * Menüden bağımsız statik sayfaların son güncellenme tarihi. Sitemap'te
 * `new Date()` kullanmak her isteği "bugün değişti" diye işaretlerdi; içerik
 * elle güncellendiğinde bu sabit de güncellenmeli.
 */
export const CONTENT_UPDATED = new Date("2026-09-09");

/**
 * Herkese açık, indekslenebilir sayfalar. Sitemap, 404 gövdesi ve footer
 * yalnızca bunları listeler.
 */
export const INDEXABLE_ROUTES = [
    { path: "/", title: "Günlük Menü", priority: 1 },
    { path: "/hakkinda", title: "Hakkında", priority: 0.6 },
    { path: "/gizlilik", title: "Gizlilik Politikası", priority: 0.5 },
] as const;

/**
 * Girişe bağlı sayfalar. İçerik kullanıcıya özel olduğu için indekslenmezler
 * (bkz. app/robots.ts) ve markdown karşılıkları yalnızca bir nottur.
 * proxy.ts da korunan route listesini buradan alır.
 */
export const LOGIN_REQUIRED_ROUTES = [
    { path: "/favorilerim", title: "Favorilerim" },
    { path: "/kalori-takibi", title: "Kalori Takibi" },
    { path: "/ayarlar", title: "Hesap Ayarları" },
] as const;

export function absoluteUrl(path: string): string {
    return new URL(path, SITE_URL).toString();
}

/** Sondaki eğik çizgileri atar: "/hakkinda/" → "/hakkinda", "" → "/" */
export function normalizePath(path: string | null | undefined): string {
    if (!path) return "/";
    const trimmed = path.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
}

/**
 * Bu yolun markdown karşılığı var mı? Yoksa istek 404 olmalı.
 *
 * Next'in rewrite'ı hedef route'un 404'ünü 200'e çevirdiği için bu ayrım
 * proxy'de yapılıyor; aksi halde her adres "var" gibi görünürdü.
 */
export function hasMarkdownRendition(path: string): boolean {
    const normalized = normalizePath(path);
    return (
        INDEXABLE_ROUTES.some((route) => route.path === normalized) ||
        LOGIN_REQUIRED_ROUTES.some((route) => route.path === normalized)
    );
}
