import type { ContentPage } from "./types";
import { CONTACT_EMAIL, REPO_URL, UPSTREAM_URL } from "../site";

export const aboutPage: ContentPage = {
    path: "/hakkinda",
    title: "Hakkında",
    description:
        "Yemekhane, Çukurova Üniversitesi Merkezi Kafeterya menüsünü günlük olarak sunan bağımsız ve açık kaynak bir öğrenci projesidir.",
    intro:
        "Yemekhane, Çukurova Üniversitesi Merkezi Kafeterya'sının günlük yemek menüsünü tek sayfada, hızlı ve okunabilir biçimde sunmak için yapıldı. Üniversitenin resmî sitesindeki menü sayfası mobilde zor okunuyor ve geçmiş günlere bakmak kolay değil; bu proje aynı veriyi daha kullanışlı bir arayüzle gösteriyor.",
    sections: [
        {
            heading: "Bu proje üniversitenin resmî sitesi değil",
            paragraphs: [
                "Bu site Çukurova Üniversitesi'nden tamamen bağımsızdır. Üniversite tarafından yürütülmez, denetlenmez veya onaylanmaz. Gönüllü olarak geliştirilen, kaynak kodu herkese açık bir öğrenci projesidir.",
                "Akademik takvim, kayıt işlemleri, bölüm bilgileri, yemekhane çalışma saatleri veya ücretler gibi konularda tek geçerli kaynak üniversitenin kendi sitesidir. Bu sitede yalnızca menü verisi bulunur.",
            ],
            links: [
                { label: "Çukurova Üniversitesi", href: "https://www.cukurova.edu.tr/" },
                { label: "Resmî yemekhane sayfası", href: UPSTREAM_URL },
            ],
        },
        {
            heading: "Veri nereden geliyor?",
            paragraphs: [
                "Menü verisi, üniversitenin resmî yemekhane sayfasından her sabah otomatik olarak çekilir. Yemek adları, kalori değerleri ve gün bilgisi olduğu gibi aktarılır; üzerinde düzeltme veya tahmin yapılmaz.",
                "Yemek detaylarındaki malzeme listesi ise önbelleğe alınmaz. Yemekhane bir yemeğin reçetesini kimliğini değiştirmeden güncelleyebildiği için malzemeler her detay görüntülemesinde kaynaktan yeniden okunur. Bayat bir kopya göstermek yerine güncel veriyi göstermeyi tercih ediyoruz.",
            ],
        },
        {
            heading: "Neler yapabilirsin?",
            bullets: [
                "Bugünün ve yüklü olan diğer günlerin menüsünü yemeklerin kalori değerleriyle birlikte görebilirsin.",
                "Yemek detayına girip malzemeleri ve görselini inceleyebilirsin.",
                "Favori yemeklerini işaretleyip menüde çıktığı sabah e-posta bildirimi alabilirsin.",
                "Günlük kalori hedefi belirleyip yediğin yemekleri günlüğüne kaydedebilirsin.",
                "Menüdeki yemeklerin alerjen uyarılarını görebilir, kendi alerjenlerini seçip uyarı alabilirsin.",
                "Günün menüsü altında yorum yazabilir, fotoğraf paylaşabilir ve diğer öğrencilerin yorumlarını okuyabilirsin.",
            ],
        },
        {
            heading: "Alerjen bilgisi nasıl çalışır?",
            paragraphs: [
                "Alerjen etiketleri, yemeğin malzeme listesi elle hazırlanmış bir malzeme–alerjen sözlüğüyle eşleştirilerek üretilir. Sonuç iki güven düzeyiyle gösterilir: kesin ve içerebilir.",
                "Bu yalnızca bir uyarı mekanizmasıdır ve bir yemeğin güvenli olduğunu asla iddia etmez. Bir alerjenin listede görünmemesi, o alerjenin yemekte bulunmadığı anlamına gelmez; sözlükte tanınmayan bir malzeme varsa yemek eksik veri durumundadır. Ciddi alerjilerde tek güvenilir yol yemekhaneye doğrudan sormaktır.",
            ],
        },
        {
            heading: "Bilmen gereken sınırlar",
            bullets: [
                "Yemekhane menüyü son dakika değiştirebilir; sitedeki menü kaynaktaki son hâli yansıtır.",
                "Kalori değerleri üniversitenin yayınladığı değerlerdir, porsiyona göre değişebilir.",
                "Tatil ve resmî tatil günlerinde Merkezi Kafeterya hizmet vermez; o günler menüsüz görünür.",
                "Kaynak sayfa erişilemez olduğunda o günün verisi eksik kalabilir.",
            ],
        },
        {
            heading: "Açık kaynak, katkı ve iletişim",
            paragraphs: [
                "Projenin tamamı açık kaynaktır. Hata bildirmek, öneri iletmek veya katkı vermek istersen GitHub deposundaki issue'ları kullanabilirsin. Menü verisiyle ilgili bir hata gördüğünde önce resmî yemekhane sayfasını kontrol etmen faydalı olur; çoğu tutarsızlık kaynaktaki veriden gelir.",
            ],
            links: [
                { label: "GitHub deposu", href: REPO_URL },
                { label: "Hata bildir / öneri gönder", href: `${REPO_URL}/issues` },
                { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
            ],
        },
    ],
};
