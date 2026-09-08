import { Suspense } from "react"
import type { Metadata } from "next"
import { loadAllMenuData } from "@/lib/menu-loader"
import {
    SITE_AUTHOR,
    SITE_AUTHOR_URL,
    SITE_LANGUAGE,
    SITE_LONG_DESCRIPTION,
    SITE_NAME,
    SITE_REPO_URL,
    SITE_URL,
    UPSTREAM_URL,
} from "@/lib/site"
import MenuPage from "./menu-page"

// Kanonik URL yalnızca ana sayfada tanımlanır; layout'a konursa tüm alt
// sayfalar da "/" iddia eder.
export const metadata: Metadata = {
    alternates: {
        canonical: "/",
    },
}

/**
 * Ana sayfanın JSON-LD kimliği. Organization DEĞİL: proje üniversiteden
 * bağımsız ve gönüllü olduğu için kurumsal bir varlık gibi görünmemeli.
 * WebApplication + WebSite ikilisi, ajanların siteyi "ücretsiz bir menü
 * uygulaması" olarak çözümlemesi için yeterli.
 */
const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: `${SITE_URL}/`,
            name: SITE_NAME,
            description: SITE_LONG_DESCRIPTION,
            inLanguage: SITE_LANGUAGE,
            author: { "@id": `${SITE_URL}/#author` },
        },
        {
            "@type": "WebApplication",
            "@id": `${SITE_URL}/#webapp`,
            url: `${SITE_URL}/`,
            name: SITE_NAME,
            alternateName: "cukurova.app",
            description: SITE_LONG_DESCRIPTION,
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Any",
            browserRequirements: "Requires JavaScript for interactive features",
            inLanguage: SITE_LANGUAGE,
            isAccessibleForFree: true,
            isFamilyFriendly: true,
            license: "https://opensource.org/licenses/MIT",
            codeRepository: SITE_REPO_URL,
            isBasedOn: UPSTREAM_URL,
            featureList: [
                "Günlük yemekhane menüsü",
                "Kalori bilgisi ve kalori takibi",
                "Alerjen etiketleri (AB/TGK 14 alerjen)",
                "Favori yemek bildirimleri",
                "Menü yorumları",
            ],
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "TRY",
            },
            author: { "@id": `${SITE_URL}/#author` },
        },
        {
            "@type": "Person",
            "@id": `${SITE_URL}/#author`,
            name: SITE_AUTHOR,
            url: SITE_AUTHOR_URL,
        },
    ],
}

/**
 * JSON.stringify çıktısındaki "<" karakteri kaçırılır: script bloğunun
 * erken kapanmasını önler. (Veri tamamen statik olsa da alışkanlık olarak.)
 */
function JsonLd() {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
            }}
        />
    )
}

// Her sayfa ziyaretinde menü verisi sunucudan taze çekilir; ISR/önbellek kullanılmaz.
// Açık sekmelerdeki gün değişimi ise client tarafında use-day-change hook'u ile algılanır.
export const dynamic = "force-dynamic"

export default async function Home() {
  try {
    const menuData = await loadAllMenuData()
    return (
      <>
        <JsonLd />
        <Suspense>
          <MenuPage menuData={menuData} />
        </Suspense>
      </>
    )
  } catch (error) {
    return (
      <>
        <JsonLd />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold mb-4">Veri Bulunamadı</h1>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : "Menü verisi yüklenemedi."}
            </p>
            <p className="text-sm text-muted-foreground">
              Lütfen <code className="bg-muted px-2 py-1 rounded">pnpm scrape</code> komutunu çalıştırarak veri oluşturun.
            </p>
          </div>
        </div>
      </>
    )
  }
}
