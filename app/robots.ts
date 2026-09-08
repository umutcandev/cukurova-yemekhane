import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

/**
 * Tüm tarayıcılara ve ajanlara açık. Tek amacı sitemap ve llms.txt'i
 * keşfedilebilir kılmak — daha önce robots.txt yoktu (404 → varsayılan "izin ver"),
 * bu dosya o davranışı değiştirmez, sadece açıkça yazar.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    }
}
