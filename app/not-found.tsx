import Link from "next/link"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { INDEXABLE_ROUTES, absoluteUrl } from "@/lib/site"

/**
 * Gerçek HTTP 404 döner. Gövdede site haritası ve makine okunur kaynaklar
 * duruyor ki hem kullanıcı hem ajan buradan devam edebilsin.
 */
export default function NotFound() {
    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
                <p className="font-mono text-xs text-muted-foreground/70">404</p>
                <h1 className="mt-2 text-lg font-semibold text-foreground">
                    Sayfa bulunamadı
                </h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Aradığın adres bu sitede yok. Menüye dönebilir veya aşağıdaki
                    sayfalardan birine geçebilirsin.
                </p>

                <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/">Menüye dön</Link>
                </Button>

                <section className="mt-8 space-y-3">
                    <h2 className="text-base font-semibold text-foreground">Site haritası</h2>
                    <ul className="space-y-1.5">
                        {INDEXABLE_ROUTES.map((route) => (
                            <li key={route.path}>
                                <Link
                                    href={route.path}
                                    className="text-sm text-foreground underline underline-offset-2 hover:text-primary"
                                >
                                    {route.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mt-8 space-y-3">
                    <h2 className="text-base font-semibold text-foreground">
                        Makine okunur kaynaklar
                    </h2>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li>
                            <a
                                href="/llms.txt"
                                className="text-foreground underline underline-offset-2 hover:text-primary"
                            >
                                /llms.txt
                            </a>{" "}
                            — ajanlar için kullanım talimatları
                        </li>
                        <li>
                            <a
                                href="/sitemap.xml"
                                className="text-foreground underline underline-offset-2 hover:text-primary"
                            >
                                /sitemap.xml
                            </a>{" "}
                            — indekslenebilir adresler
                        </li>
                        <li>
                            <code className="text-xs">
                                {absoluteUrl("/api/menu/date/YYYY-MM-DD")}
                            </code>{" "}
                            — belirli bir günün menüsü (JSON)
                        </li>
                    </ul>
                </section>
            </div>
        </main>
    )
}
