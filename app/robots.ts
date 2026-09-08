import type { MetadataRoute } from "next"
import { LOGIN_REQUIRED_ROUTES, SITE_URL, absoluteUrl } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                // Menü API'si bilerek açık: llms.txt ajanları oraya yönlendiriyor.
                allow: ["/", "/api/menu/"],
                // Girişe bağlı sayfaların içeriği kişiye özel; indekslenecek bir şey yok.
                disallow: ["/api/", ...LOGIN_REQUIRED_ROUTES.map((route) => route.path)],
            },
        ],
        sitemap: absoluteUrl("/sitemap.xml"),
        // Yandex'e özel direktif; protokolsüz, eğik çizgisiz alan adı bekliyor.
        host: new URL(SITE_URL).hostname,
    }
}
