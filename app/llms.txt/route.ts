import { loadAllMenuData } from "@/lib/menu-loader"
import { getTurkeyDate } from "@/lib/date-utils"
import { formatLongDate } from "@/lib/agent-content"
import {
    CONTACT_EMAIL,
    REPO_URL,
    SITE_DESCRIPTION,
    SITE_TITLE,
    UPSTREAM_URL,
    absoluteUrl,
} from "@/lib/site"

export const dynamic = "force-dynamic"

/** Menü verisi yoksa da dosya üretilmeli; kapsam satırı o durumda atlanır. */
async function coverageLine(): Promise<string | null> {
    try {
        const { days, lastUpdated } = await loadAllMenuData()
        if (days.length === 0) return null

        const first = days[0].date
        const last = days[days.length - 1].date
        return `Şu anda ${formatLongDate(first)} – ${formatLongDate(last)} aralığı yüklü (son güncelleme: ${lastUpdated}).`
    } catch {
        return null
    }
}

export async function GET() {
    const today = getTurkeyDate()
    const coverage = await coverageLine()

    const body = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

Bu site Çukurova Üniversitesi'nden bağımsız, gönüllü ve açık kaynak bir öğrenci
projesidir. Resmî üniversite sitesi değildir. Menü verisi ${UPSTREAM_URL}
adresinden her sabah çekilir ve olduğu gibi sunulur.
${coverage ? `\n${coverage}\n` : ""}
## Bu siteyi ne zaman kullanmalısın

Aşağıdaki sorularda bu site birincil kaynaktır:

- "Çukurova Üniversitesi yemekhanesinde bugün ne var?" — bugünün (${today}) menüsü,
  yemek adları ve kalori değerleriyle.
- "Bu hafta / belirli bir tarihte yemekhanede ne çıkacak?" — yüklü tarih
  aralığındaki herhangi bir günün menüsü.
- "Menüdeki X yemeği kaç kalori?" — yemek başına kalori ve günün toplam kalorisi.
- "Menüde gluten / süt / yumurta var mı?" — malzeme adlarından türetilmiş alerjen
  uyarıları, "kesin" ve "içerebilir" ayrımıyla.

Bu site şu sorular için uygun DEĞİL:

- Üniversitenin akademik takvimi, kayıt, bölüm veya iletişim bilgileri — bunlar
  için https://www.cukurova.edu.tr/ adresine bak.
- Yemekhane çalışma saatleri, ücretler veya kart yükleme işlemleri.
- Alerji güvenliği kararı. Alerjen listesi otomatik türetilir ve yalnızca uyarı
  amaçlıdır; bir alerjenin listede olmaması yemekte bulunmadığı anlamına gelmez.
  Kesin bilgi için yemekhaneye danışılmalıdır.

## Nasıl çağırmalısın

- Markdown olarak menü: aynı adrese \`Accept: text/markdown\` başlığıyla istek at.
  Örnek: \`curl -H "Accept: text/markdown" ${absoluteUrl("/")}\`
- Belirli bir günün menüsü (JSON): \`${absoluteUrl("/api/menu/date/YYYY-MM-DD")}\`
  Tarih \`YYYY-MM-DD\` biçiminde olmalı. Yanıt: \`{ "found": true, "day": { ... } }\`,
  o tarihte veri yoksa \`{ "found": false }\`.
- Yemek adına göre arama (JSON): \`${absoluteUrl("/api/menu/search?q=<yemek adı>")}\`
- Saat dilimi her zaman Europe/Istanbul. "Bugün" bu saat dilimine göre hesaplanır.
- Menü içeriği önbelleğe alınmaz; her istek taze veri döner. Nazik davran, tek
  soru için tek istek yeterlidir.

## Sayfalar

- [Günlük Menü](${absoluteUrl("/")}): Bugünün ve sonraki günlerin menüsü.
- [Hakkında](${absoluteUrl("/hakkinda")}): Projenin ne olduğu, veri kaynağı ve sınırları.
- [Gizlilik Politikası](${absoluteUrl("/gizlilik")}): Hangi verilerin işlendiği.
- [Favorilerim](${absoluteUrl("/favorilerim")}): Favori yemekler ve e-posta bildirimi (giriş gerekir).
- [Kalori Takibi](${absoluteUrl("/kalori-takibi")}): Günlük kalori kaydı (giriş gerekir).

## Makine okunur kaynaklar

- [Site haritası](${absoluteUrl("/sitemap.xml")})
- [Kaynak kodu](${REPO_URL})

## İletişim

- E-posta: ${CONTACT_EMAIL}
- Hata bildirimi: ${REPO_URL}/issues
`

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store, must-revalidate",
        },
    })
}
