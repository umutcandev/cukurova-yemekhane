import type { Metadata } from "next"

import { SITE_NAME, SITE_TITLE } from "./site"

export const OG_IMAGE = {
    url: "/github-banner.png",
    width: 1500,
    height: 518,
    alt: SITE_TITLE,
}

/**
 * Next `openGraph` ve `twitter` alanlarını miras alırken merge etmiyor, komple
 * değiştiriyor: sayfa kendi og:title'ını verdiği anda layout'tan gelen görsel,
 * siteName ve locale düşüyor. Bu yüzden her sayfa tam nesneyi buradan üretir.
 *
 * `path` verilmezse og:url basılmaz — root layout'ta bilinçli olarak boş
 * bırakılıyor, aksi halde kendi metadata'sı olmayan her sayfa ana sayfanın
 * adresini kendi og:url'i olarak yayımlar.
 */
export function socialMetadata({
    title,
    description,
    path,
    article = false,
}: {
    title: string
    description: string
    path?: string
    article?: boolean
}): Metadata {
    const shared = {
        ...(path ? { url: path } : {}),
        siteName: SITE_NAME,
        title,
        description,
        locale: "tr_TR",
        images: [OG_IMAGE],
    }

    return {
        openGraph: article
            ? { ...shared, type: "article" }
            : { ...shared, type: "website" },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [OG_IMAGE],
        },
    }
}
