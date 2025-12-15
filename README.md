# CU Yemekhane - Çukurova Üniversitesi Yemek Menüsü Uygulaması

Demo: [https://cukurova.vercel.app](https://cukurova.vercel.app)

Bu proje, Çukurova Üniversitesi yemekhanesinin günlük yemek menülerini görüntülemek için geliştirilmiş, yüksek performanslı ve modern bir web uygulamasıdır. Veriler üniversitenin resmi web sitesinden **web scraping** yöntemiyle çekilir, yapılandırılmış JSON formatında saklanır ve Next.js 16 altyapısı ile kullanıcıya sunulur.

## Teknik Mimari

Proje, **Extract-Transform-Load (ETL)** benzeri bir veri akışı üzerine kuruludur:

1.  **Veri Çekme (Scraping)**: Node.js tabanlı bir script (`scripts/scrape-menu.ts`), `cheerio` kütüphanesini kullanarak üniversitenin ASP tabanlı web sitesini tarar.
2.  **Veri İşleme (Parsing)**: Gelen ham HTML verisi, `iconv-lite` kullanılarak `Windows-1254` formatından `UTF-8`'e dönüştürülür ve DOM üzerinden gün, yemek ve kalori bilgileri ayrıştırılır.
3.  **Veri Saklama (Storage)**: İşlenen veriler `public/data/` dizinine tarih damgalı JSON dosyaları (örn. `menu-2025-12-20251215.json`) olarak kaydedilir.
4.  **Sunum (Presentation)**: Next.js uygulaması, bu statik JSON dosyalarını okuyarak sunucu tarafında (Server Components) render eder ve istemciye gönderir.

## Teknoloji Yığını

Proje en güncel web teknolojileri kullanılarak geliştirilmiştir:

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Directory, Server Components)
-   **UI Library**: [React 19](https://react.dev/)
-   **Dil**: [TypeScript](https://www.typescriptlang.org/) (Tam tip güvenliği)
-   **Stil**: [Tailwind CSS 4](https://tailwindcss.com/) (PostCSS ile entegre)
-   **Komponent Kütüphanesi**: [Radix UI](https://www.radix-ui.com/)
-   **İkonlar**: [Lucide React](https://lucide.dev/)
-   **Scraping**: `cheerio`, `iconv-lite`
-   **Form & Validasyon**: `react-hook-form`, `zod`
-   **Paket Yöneticisi**: pnpm (veya npm)

## Proje Yapısı

```
cu-yemekhane/
├── app/                  # Next.js App Router sayfaları
│   ├── api/              # API rotaları
│   ├── menu-page.tsx     # Ana menü görünümü (UI)
│   └── page.tsx          # Ana sayfa (Routing)
├── components/           # Yeniden kullanılabilir UI bileşenleri
│   └── ui/               # Temel UI elementleri (Button, Card, vb.)
├── lib/                  # Yardımcı fonksyionlar ve iş mantığı
│   ├── scraper.ts        # Cheerio ile HTML parse mantığı
│   ├── menu-loader.ts    # JSON dosya okuma işlemleri
│   └── types.ts          # TypeScript tip tanımları
├── public/
│   └── data/             # Scrape edilen JSON menü dosyaları
├── scripts/              # CLI scriptleri
│   └── scrape-menu.ts    # Scraper tetikleyici script
└── ...konfigürasyon dosyaları
```

## Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/umutcandev/cu-yemekhane.git
cd cu-yemekhane
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
# veya
pnpm install
```

### 3. Veri Çekin (Scraping)
Uygulamayı çalıştırmadan önce güncel menü verisini çekmeniz gerekir. Bu işlem `public/data` klasörüne gerekli JSON dosyasını oluşturacaktır.

```bash
npm run scrape
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresine giderek uygulamayı görüntüleyebilirsiniz.

## Veri Modeli

Scraper tarafından oluşturulan JSON verisi şu yapıdadır:

```typescript
interface MenuData {
  month: string;          // Örn: "2025-12"
  lastUpdated: string;    // ISO Date
  scrapeDate: string;     // YYYY-MM-DD
  totalDays: number;
  days: {
    ymk: number;          // Yemekhane sistemindeki ID
    date: string;         // YYYY-MM-DD
    dayName: string;      // Örn: "Pazartesi"
    hasData: boolean;     // Menü var mı?
    totalCalories: number;
    meals: {
      id: string;
      name: string;
      calories: number;
      category: string;
    }[];
  }[];
}
```

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.
