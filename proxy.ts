import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prefersMarkdown } from "@/lib/accept-markdown"
import {
    MARKDOWN_HEADERS,
    MARKDOWN_PATH_HEADER,
    formatNotFoundMarkdown,
} from "@/lib/markdown-response"
import { LOGIN_REQUIRED_ROUTES, hasMarkdownRendition, normalizePath } from "@/lib/site"

// Protected routes that require authentication
const protectedRoutes = LOGIN_REQUIRED_ROUTES.map((route) => route.path)

export default async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    /*
     * acceptmarkdown.com içerik pazarlığı: `Accept: text/markdown` gelen sayfa
     * istekleri /api/markdown'a rewrite edilir. Adres aynı kalır, gövde markdown
     * döner. Kontrol saf string ayrıştırması — auth yüklenmeden önce yapılıyor.
     */
    if (prefersMarkdown(req.headers.get("accept"))) {
        /*
         * Var olmayan yol gerçek 404 dönmeli. Next, rewrite ettiği route'un
         * 404'ünü 200'e çevirdiği için bu yanıt doğrudan burada üretiliyor.
         */
        if (!hasMarkdownRendition(pathname)) {
            return new NextResponse(formatNotFoundMarkdown(), {
                status: 404,
                headers: MARKDOWN_HEADERS,
            })
        }

        const url = req.nextUrl.clone()
        url.pathname = "/api/markdown"
        url.search = ""

        // Yol header ile taşınıyor; nedeni MARKDOWN_PATH_HEADER'da açıklanıyor.
        const headers = new Headers(req.headers)
        headers.set(MARKDOWN_PATH_HEADER, normalizePath(pathname))
        return NextResponse.rewrite(url, { request: { headers } })
    }

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

    // auth yalnızca korunan route'larda yüklensin diye dinamik import
    if (isProtected) {
        const home = req.nextUrl.clone()
        home.pathname = "/"

        /*
         * Oturum doğrulanamadığında kapı kapalı kalır. auth() hata yuttuğunda
         * (UntrustedHost, veritabanı erişilemez, bozuk JWT) null olmayan ama
         * kullanıcısız bir değer dönebiliyor; `!session` bunu geçirirdi.
         */
        try {
            const { auth } = await import("@/lib/auth")
            const session = await auth()
            if (!session?.user) return NextResponse.redirect(home)
        } catch {
            return NextResponse.redirect(home)
        }
    }

    /*
     * `Vary: Accept` burada eklenmiyor: NextResponse.next() üzerine yazılan Vary
     * son yanıta ulaşmıyor. Header next.config.mjs'teki headers() içinde tanımlı.
     */
    return NextResponse.next()
}

export const config = {
    /*
     * Markdown pazarlığı ana sayfada da çalışmak zorunda olduğu için matcher
     * tüm sayfa yollarını kapsıyor; statik dosyalar, next internal route'lar,
     * API route'ları ve uzantılı dosyalar (llms.txt, sitemap.xml, görseller)
     * hariç. Auth yalnızca protectedRoutes eşleşmesinde yükleniyor, dolayısıyla
     * diğer yollarda maliyet tek bir string ayrıştırmasından ibaret.
     *
     * Var olmayan yollar da kapsam içinde — 404'ün markdown karşılığı buradan
     * yönlendiriliyor.
     */
    matcher: ["/((?!api/|_next/|.*\\.).*)"],
}
