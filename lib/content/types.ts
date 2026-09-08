/**
 * Metin sayfalarının ortak modeli.
 *
 * Aynı içerik iki yerde sunuluyor: React sayfası (components/content-page.tsx)
 * ve `Accept: text/markdown` yanıtı (lib/agent-content.ts). İkisinin zamanla
 * ayrışmaması için kaynak metin burada, yapılandırılmış biçimde tutulur.
 *
 * Paragraflar düz metindir — satır içi bağlantı yerine `links` kullanılır ki
 * markdown ve JSX aynı veriden üretilebilsin.
 */

export interface ContentLink {
    label: string;
    href: string;
}

export interface ContentSection {
    heading: string;
    paragraphs?: string[];
    bullets?: string[];
    links?: ContentLink[];
}

export interface ContentPage {
    /** URL yolu — sitemap ve markdown eşlemesi bunu kullanır */
    path: string;
    title: string;
    /** <meta name="description"> ve markdown alt başlığı */
    description: string;
    intro: string;
    sections: ContentSection[];
}
