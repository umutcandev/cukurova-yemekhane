import { INDEXABLE_ROUTES, absoluteUrl } from "./site";

/**
 * Markdown yanıtlarının ortak parçaları.
 *
 * Bilerek hafif tutuldu: proxy.ts bu dosyayı içe aktarıyor ve oraya menü
 * yükleyici, alerjen sözlüğü gibi ağır modüllerin sızmaması gerekiyor.
 */

export const MARKDOWN_HEADERS = {
    "Content-Type": "text/markdown; charset=utf-8",
    // CDN, markdown isteyen ajana HTML varyantını (veya tersini) vermesin.
    Vary: "Accept, Accept-Encoding",
    "Cache-Control": "no-store, must-revalidate",
};

/**
 * İstenen yolu proxy'den route handler'a taşıyan header.
 *
 * Query string ile taşınamıyor: rewrite hedefinin query'si route handler'ın
 * `request.url`ine ulaşmıyor, orada orijinal istek URL'i duruyor.
 */
export const MARKDOWN_PATH_HEADER = "x-markdown-path";

/** 404 gövdesi: ajan nereden devam edeceğini buradan öğrenir. */
export function formatNotFoundMarkdown(): string {
    const routes = INDEXABLE_ROUTES.map(
        (route) => `- [${route.title}](${absoluteUrl(route.path)})`
    ).join("\n");

    return `# 404 — Sayfa bulunamadı

Aradığın adres bu sitede yok.

## Site haritası

${routes}

## Makine okunur kaynaklar

- [Ajan talimatları (llms.txt)](${absoluteUrl("/llms.txt")})
- [Site haritası (XML)](${absoluteUrl("/sitemap.xml")})
- Belirli bir günün menüsü (JSON): ${absoluteUrl("/api/menu/date/YYYY-MM-DD")}
`;
}
