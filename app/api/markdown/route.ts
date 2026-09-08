import { loadAllMenuData } from "@/lib/menu-loader"
import { getTurkeyDate } from "@/lib/date-utils"
import { formatContentPageMarkdown, formatMenuMarkdown } from "@/lib/agent-content"
import {
    MARKDOWN_HEADERS,
    MARKDOWN_PATH_HEADER,
    formatNotFoundMarkdown,
} from "@/lib/markdown-response"
import { aboutPage } from "@/lib/content/about"
import { privacyPage } from "@/lib/content/privacy"
import { LOGIN_REQUIRED_ROUTES, SITE_TITLE, absoluteUrl, normalizePath } from "@/lib/site"

export const dynamic = "force-dynamic"

/**
 * `Accept: text/markdown` gelen sayfa isteklerinin markdown karşılığı.
 * proxy.ts buraya rewrite eder; adres çubuğundaki URL değişmez.
 *
 * Bilinmeyen yollar buraya hiç gelmez — Next rewrite'ta 404'ü 200'e çevirdiği
 * için o ayrım proxy'de yapılıyor. Buradaki 404 yalnızca doğrudan çağrılar için.
 */

/** Girişe bağlı sayfaların içeriği kişiye özel; markdown karşılığı yalnızca bir not. */
const LOGIN_REQUIRED = new Map<string, string>(
    LOGIN_REQUIRED_ROUTES.map((route) => [route.path, route.title])
)

async function menuMarkdown(): Promise<string> {
    try {
        const menuData = await loadAllMenuData()
        return formatMenuMarkdown(menuData.days, getTurkeyDate())
    } catch {
        return `# ${SITE_TITLE}\n\nMenü verisi şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.`
    }
}

function loginRequiredMarkdown(title: string): string {
    return `# ${title}

Bu sayfa Google ile giriş yapmayı gerektirir ve içeriği kullanıcıya özeldir;
makine okunur bir karşılığı sunulmaz.

- [Günlük menü](${absoluteUrl("/")})
- [Hakkında](${absoluteUrl(aboutPage.path)})
- [Gizlilik Politikası](${absoluteUrl(privacyPage.path)})
`
}

export async function GET(request: Request) {
    /*
     * Yol proxy'nin bastığı header'dan okunur; `?path=` yalnızca bu route'un
     * doğrudan çağrıldığı durumlar için (elle test, hata ayıklama).
     */
    const path = normalizePath(
        request.headers.get(MARKDOWN_PATH_HEADER) ??
            new URL(request.url).searchParams.get("path")
    )

    if (path === "/") {
        return new Response(await menuMarkdown(), { headers: MARKDOWN_HEADERS })
    }

    if (path === aboutPage.path) {
        return new Response(formatContentPageMarkdown(aboutPage), { headers: MARKDOWN_HEADERS })
    }

    if (path === privacyPage.path) {
        return new Response(formatContentPageMarkdown(privacyPage), { headers: MARKDOWN_HEADERS })
    }

    const loginRequiredTitle = LOGIN_REQUIRED.get(path)
    if (loginRequiredTitle) {
        return new Response(loginRequiredMarkdown(loginRequiredTitle), {
            headers: MARKDOWN_HEADERS,
        })
    }

    return new Response(formatNotFoundMarkdown(), { status: 404, headers: MARKDOWN_HEADERS })
}
