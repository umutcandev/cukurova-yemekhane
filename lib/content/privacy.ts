import type { ContentPage } from "./types";
import { CONTACT_EMAIL, REPO_URL } from "../site";

export const privacyPage: ContentPage = {
    path: "/gizlilik",
    title: "Gizlilik Politikası",
    description:
        "Yemekhane'nin hangi kişisel verileri işlediği, neden işlediği, hangi üçüncü taraf hizmetleri kullandığı ve KVKK kapsamındaki haklarınız.",
    intro:
        "Bu sayfa Yemekhane'nin hangi verileri işlediğini açıklar. Menüyü görmek için hesap açmanız gerekmez ve giriş yapmadan gezerken hiçbir kişisel veriniz veritabanına kaydedilmez. Favoriler, kalori takibi ve yorumlar gibi özellikler yalnızca Google ile giriş yaptığınızda çalışır ve ancak o zaman size ait veri saklanır.",
    sections: [
        {
            heading: "Giriş yapmadan kullanım",
            paragraphs: [
                "Menüyü görüntülemek için oturum açmanız gerekmez. Giriş yapmadığınızda sitede size ait bir kayıt oluşturulmaz; yalnızca aşağıda anlatılan analiz ve reklam çerezleri ile hız sınırlama işlemleri geçerlidir.",
            ],
        },
        {
            heading: "Hesap açtığınızda işlenen veriler",
            paragraphs: [
                "Giriş Google hesabınızla yapılır. Google'dan yalnızca kimliğinizi doğrulamak için gereken temel bilgiler alınır; şifreniz hiçbir zaman bu siteye ulaşmaz.",
            ],
            bullets: [
                "Kimlik bilgileri: adınız, e-posta adresiniz ve profil fotoğrafınızın adresi.",
                "Oturum bilgileri: giriş oturumunuzu sürdürmek için kullanılan oturum kayıtları ve çerezleri.",
                "Profil tercihleri: takma adınız, yüklediyseniz özel profil fotoğrafınız ve profil fotoğrafını gizleme tercihiniz.",
                "Favori yemekler: favorilediğiniz yemek adları ve favori e-posta bildirimi tercihiniz.",
                "Kalori takibi: günlük kalori hedefiniz ve günlüğe eklediğiniz yemekler ile tarihleri.",
                "Alerjen tercihleri: seçtiğiniz alerjenler ve alerjen e-posta bildirimi tercihiniz.",
                "Yorum ve etkileşimler: yazdığınız yorumlar, yüklediğiniz yorum fotoğrafları, emoji tepkileriniz, menü beğenileriniz ve gönderdiğiniz yorum şikâyetleri.",
                "Bildirim kayıtları: site içi bildirimleriniz ve aynı e-postanın iki kez gönderilmesini önlemek için tutulan gönderim kaydı.",
            ],
        },
        {
            heading: "Bu veriler neden işleniyor?",
            bullets: [
                "Hesabınızı tanımak ve oturumunuzu sürdürmek.",
                "Favori, kalori ve alerjen özelliklerini size özel çalıştırmak.",
                "İstediğiniz durumlarda e-posta bildirimi göndermek.",
                "Yorumların kime ait olduğunu göstermek ve kötüye kullanımı sınırlamak.",
                "Sitenin genel kullanım istatistiklerini anonim olarak ölçmek.",
            ],
        },
        {
            heading: "IP adresi ve kötüye kullanım önleme",
            paragraphs: [
                "Yorum yazarken ve tepki verirken IP adresiniz yalnızca hız sınırlama için geçici olarak işlenir. Bu bilgi veritabanına yazılmaz; sınırlama sayaçları kısa süreli olarak bellekte veya hız sınırlama servisinde tutulur ve süresi dolduğunda kendiliğinden silinir.",
                "Yorumlar ayrıca otomatik bir küfür filtresinden geçer ve şikâyet edilen yorumlar moderasyon için e-posta ile site yöneticisine iletilir.",
            ],
        },
        {
            heading: "Kullanılan üçüncü taraf hizmetler",
            bullets: [
                "Google (Oturum açma): kimlik doğrulama.",
                "Google Analytics: anonim kullanım istatistikleri; ziyaretçi davranışını toplu düzeyde ölçmek için çerez kullanır.",
                "Google AdSense: sitede gösterilen reklamlar; reklam kişiselleştirmesi için çerez kullanabilir.",
                "Cloudflare R2: yorumlara eklenen fotoğrafların depolanması.",
                "Google SMTP (Gmail): bildirim e-postalarının gönderilmesi.",
                "Upstash Redis: yapılandırılmışsa dağıtık hız sınırlama sayaçları.",
                "Veritabanı: veriler kendi sunucumuzda barındırılan PostgreSQL veritabanında saklanır.",
            ],
            paragraphs: [
                "Bu hizmetlerin kendi gizlilik politikaları geçerlidir. Verileriniz reklam veya pazarlama amacıyla üçüncü taraflara satılmaz.",
            ],
        },
        {
            heading: "Çerezler",
            paragraphs: [
                "Zorunlu çerezler oturumunuzu açık tutmak ve tema tercihinizi hatırlamak için kullanılır; bunlar olmadan giriş yapılamaz. Bunun dışında Google Analytics ve Google AdSense kendi çerezlerini yerleştirir. Reklam kişiselleştirmesini tarayıcınızın ayarlarından veya Google'ın reklam ayarları üzerinden sınırlayabilirsiniz.",
            ],
        },
        {
            heading: "Saklama süresi",
            paragraphs: [
                "Hesabınıza bağlı veriler hesabınız var olduğu sürece saklanır. Bir favoriyi, kalori kaydını veya yorumu sildiğinizde ilgili kayıt veritabanından silinir. Hesabınız silindiğinde ona bağlı favoriler, kalori kayıtları, yorumlar, tepkiler ve bildirimler birlikte silinir.",
            ],
        },
        {
            heading: "Haklarınız ve talepleriniz",
            paragraphs: [
                "KVKK kapsamında verilerinize erişme, düzeltilmesini veya silinmesini isteme hakkınız vardır. Takma adınızı, profil fotoğrafınızı, bildirim ve alerjen tercihlerinizi Hesap Ayarları sayfasından kendiniz değiştirebilirsiniz.",
                `Hesabınızın ve tüm verilerinizin silinmesini istiyorsanız veya verilerinizin bir kopyasını talep etmek istiyorsanız ${CONTACT_EMAIL} adresine yazabilir ya da GitHub deposu üzerinden talep oluşturabilirsiniz. Talebiniz makul bir süre içinde karşılanır.`,
            ],
            links: [
                { label: "Hesap Ayarları", href: "/ayarlar" },
                { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
                { label: "Talep oluştur (GitHub)", href: `${REPO_URL}/issues` },
            ],
        },
        {
            heading: "Bu politikadaki değişiklikler",
            paragraphs: [
                "Sitede yeni bir özellik eklendiğinde bu sayfa güncellenir. Proje açık kaynak olduğu için hangi verinin nasıl işlendiğini kaynak kodundan da doğrulayabilirsiniz.",
            ],
            links: [{ label: "Kaynak kodu", href: REPO_URL }],
        },
    ],
};
