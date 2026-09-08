import Link from "next/link"

import { REPO_URL } from "@/lib/site"

/**
 * Yasal sayfaların ham HTML'deki bağlantıları. Görsel tasarımda footer yok:
 * MobileBottomNav her ekran boyutunda viewport'un altına sabitlendiği için
 * görünür bir footer onun arkasında kalıyor.
 *
 * `sr-only`: tarayıcılar ve ekran okuyucular bağlantıları görüyor, düzende yer
 * kaplamıyor. `focus-within` ile odaklanınca ortaya çıkıyor — aksi halde Tab
 * ile gezen kullanıcı görünmez bir bağlantıya düşerdi. `mb-24`, açığa çıktığında
 * sabit alt çubuğun üstünde durmasını sağlıyor.
 */
export function SiteFooter() {
    return (
        <footer className="sr-only focus-within:not-sr-only focus-within:mb-24 border-t border-border/40">
            <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <Link href="/hakkinda" className="hover:text-foreground transition-colors">
                    Hakkında
                </Link>
                <Link href="/gizlilik" className="hover:text-foreground transition-colors">
                    Gizlilik Politikası
                </Link>
                <Link
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                >
                    GitHub
                </Link>
                <span className="text-muted-foreground/60">
                    Çukurova Üniversitesi&apos;nden bağımsız, açık kaynak bir öğrenci projesi.
                </span>
            </div>
        </footer>
    )
}
