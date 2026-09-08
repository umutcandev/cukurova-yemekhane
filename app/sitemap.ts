import type { MetadataRoute } from "next"
import { loadAllMenuData } from "@/lib/menu-loader"
import { SITE_URL } from "@/lib/site"

// Menü verisi her scrape'te değiştiği için lastmod istek anında hesaplanır.
export const dynamic = "force-dynamic"

/**
 * Yalnızca indekslenebilir URL'ler listelenir.
 *
 * Dışarıda bırakılanlar:
 * - /favorilerim, /kalori-takibi → proxy.ts oturum yoksa "/" adresine
 *   yönlendiriyor, yani anonim bir tarayıcı için indekslenebilir değiller.
 * - /ayarlar → kullanıcıya özel hesap sayfası, arama sonucu olarak anlamsız.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let lastModified = new Date()

    try {
        const menuData = await loadAllMenuData()
        const parsed = new Date(menuData.lastUpdated)
        if (!Number.isNaN(parsed.getTime())) {
            lastModified = parsed
        }
    } catch {
        // Veri yoksa sitemap yine de geçerli kalmalı; bugünün tarihi kullanılır.
    }

    return [
        {
            url: `${SITE_URL}/`,
            lastModified,
            changeFrequency: "daily",
            priority: 1,
        },
    ]
}
