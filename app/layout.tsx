import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"
import { ThemeProvider } from "@/components/theme-provider"
import { MenuDataProvider } from "@/components/menu-data-provider"
import { SessionProvider } from "next-auth/react"

import { Toaster } from "@/components/ui/sonner"
import { OnboardingModal } from "@/components/onboarding-modal"
import { SiteFooter } from "@/components/site-footer"
import { socialMetadata } from "@/lib/seo"
import {
  CONTACT_EMAIL,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  UPSTREAM_URL,
} from "@/lib/site"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

/*
 * Burada bilerek `alternates` ve `robots` yok. Root layout metadata'sı kendi
 * metadata'sı olmayan her sayfaya miras kalıyor: canonical vermek girişe bağlı
 * sayfaların ve 404'ün kendini ana sayfanın kopyası ilan etmesine yol açardı,
 * `robots: index` de Next'in 404'e bastığı noindex ile çelişirdi.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  generator: "umutcandev",
  authors: [{ name: "umutcandev", url: REPO_URL }],
  ...socialMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION }),
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

/**
 * Site kimliği. Tip bilerek WebApplication: burası bir kurum sitesi değil,
 * üniversiteden bağımsız bir web uygulaması. Üniversite `about` altında
 * ayrı bir varlık olarak duruyor ki ajanlar ikisini karıştırmasın.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${SITE_URL}/#app`,
  name: SITE_TITLE,
  alternateName: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  browserRequirements: "JavaScript önerilir; menü içeriği JavaScript olmadan da sunulur.",
  inLanguage: "tr-TR",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TRY",
  },
  author: {
    "@type": "Person",
    name: "umutcandev",
    url: REPO_URL,
  },
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#publisher`,
    name: SITE_NAME,
    url: SITE_URL,
    description: "Çukurova Üniversitesi yemekhane menüsünü yayımlayan bağımsız, açık kaynak öğrenci projesi.",
    email: CONTACT_EMAIL,
    sameAs: [REPO_URL],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      url: `${REPO_URL}/issues`,
      availableLanguage: ["tr", "Turkish"],
    },
  },
  sameAs: [REPO_URL],
  about: {
    "@type": "CollegeOrUniversity",
    name: "Çukurova Üniversitesi",
    url: "https://www.cukurova.edu.tr/",
  },
  isBasedOn: UPSTREAM_URL,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <MenuDataProvider>
              {children}
              <SiteFooter />
              <OnboardingModal />
            </MenuDataProvider>
            <Toaster />
          </SessionProvider>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
