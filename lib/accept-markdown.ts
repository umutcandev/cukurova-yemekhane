/**
 * acceptmarkdown.com içerik pazarlığı: istemci `Accept: text/markdown` ile
 * sorduğunda aynı adres markdown döner.
 *
 * Tarayıcılar `text/markdown` göndermez, ama yine de q değerlerini karşılaştırıyoruz;
 * "text/html, text/markdown;q=0.1" gibi bir istekte HTML kazanmalı.
 */

interface MediaRange {
    type: string;
    quality: number;
}

function parseAccept(header: string): MediaRange[] {
    const ranges: MediaRange[] = [];

    for (const entry of header.split(",")) {
        const [rawType, ...params] = entry.trim().split(";");
        const type = rawType.trim().toLowerCase();
        if (!type) continue;

        let quality = 1;
        for (const param of params) {
            const [key, value] = param.split("=");
            if (key?.trim().toLowerCase() !== "q") continue;
            const parsed = Number.parseFloat(value ?? "");
            if (!Number.isNaN(parsed)) quality = parsed;
        }

        ranges.push({ type, quality });
    }

    return ranges;
}

export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
    if (!acceptHeader) return false;

    const ranges = parseAccept(acceptHeader);

    // Yalnızca açıkça istenen markdown sayılır; `*/*` HTML'i bozmamalı.
    const markdown = ranges.find(
        (range) => range.type === "text/markdown" || range.type === "text/x-markdown"
    );
    if (!markdown || markdown.quality <= 0) return false;

    const html = ranges.find((range) => range.type === "text/html");
    if (html && html.quality >= markdown.quality) return false;

    return true;
}
