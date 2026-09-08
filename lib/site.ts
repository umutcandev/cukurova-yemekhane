/**
 * Site geneli sabitler — metadata, JSON-LD, sitemap ve llms.txt aynı
 * kaynaktan beslensin diye tek yerde tutulur.
 *
 * Kanonik host www'dur: apex (cukurova.app) 302 ile www'ye yönlenir, bu yüzden
 * canonical/og:url/sitemap her zaman www yazmalı — aksi halde ajanlar ve
 * arama motorları yönlendirme zinciri görür.
 */

export const SITE_URL = process.env.APP_URL || "https://www.cukurova.app"

export const SITE_NAME = "Çukurova Üniversitesi Yemekhane"

/** layout.tsx metadata.description ile birebir aynı — değiştirirken ikisini de güncelle. */
export const SITE_DESCRIPTION = "Çukurova Üniversitesi Yemekhane Günlük Menü Takibi"

/**
 * JSON-LD ve llms.txt için uzun açıklama. Ajanların "bu site ne işe yarar"
 * sorusunu tek cümlede cevaplayabilmesi için kapsam ve bağımsızlık bilgisi içerir.
 */
export const SITE_LONG_DESCRIPTION =
    "Çukurova Üniversitesi yemekhanesinin günlük menüsünü, kalori bilgilerini ve " +
    "alerjen etiketlerini gösteren ücretsiz web uygulaması. Menü verisi üniversitenin " +
    "resmî yemekhane sitesinden düzenli olarak toplanır. Proje Çukurova Üniversitesinden " +
    "bağımsız, gönüllü ve açık kaynaklıdır."

export const SITE_LOCALE = "tr_TR"
export const SITE_LANGUAGE = "tr"

/** og:image — public/github-banner.png (1500x518) */
export const SITE_OG_IMAGE = {
    url: "/github-banner.png",
    width: 1500,
    height: 518,
    alt: SITE_NAME,
} as const

export const SITE_REPO_URL = "https://github.com/umutcandev/cukurova-yemekhane"
export const SITE_AUTHOR = "umutcandev"
export const SITE_AUTHOR_URL = "https://github.com/umutcandev"

/** Menü verisinin alındığı resmî kaynak. */
export const UPSTREAM_URL = "https://yemekhane.cu.edu.tr/"
