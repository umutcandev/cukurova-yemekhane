import type { MetadataRoute } from "next"
import { loadAllMenuData } from "@/lib/menu-loader"
import { CONTENT_UPDATED, INDEXABLE_ROUTES, absoluteUrl } from "@/lib/site"

export const dynamic = "force-dynamic"

/**
 * Ana sayfanın lastmod'u menü verisinin tazeliğine bağlı — scrape her sabah
 * çalıştığı için build zamanı yanlış sinyal verirdi.
 */
async function homeLastModified(): Promise<Date> {
    try {
        const { lastUpdated } = await loadAllMenuData()
        const parsed = new Date(lastUpdated)
        if (!Number.isNaN(parsed.getTime())) return parsed
    } catch {
        // Veri yoksa sitemap yine üretilmeli
    }
    return new Date()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const homeDate = await homeLastModified()

    return INDEXABLE_ROUTES.map((route) => ({
        url: absoluteUrl(route.path),
        lastModified: route.path === "/" ? homeDate : CONTENT_UPDATED,
        changeFrequency: route.path === "/" ? ("daily" as const) : ("monthly" as const),
        priority: route.priority,
    }))
}
