<div align="center">

<img alt="Çukurova Üniversitesi Yemekhane" width="30%" src="https://github.com/user-attachments/assets/17646122-441a-4e5c-b7a3-5f8c53f013a5" />


Çukurova Üniversitesi yemekhanesinin günlük yemek menülerini görüntülemek için geliştirilmiş, yüksek performanslı ve modern bir web uygulaması.

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?logo=shadcnui&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?logo=radix-ui&logoColor=white)
![NeonDB](https://img.shields.io/badge/Neon-00E599?logo=neon&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)
</div>

Demo: [https://cukurova.vercel.app](https://cukurova.vercel.app)

![Deploy with Vercel](https://vercel.com/button)

Veriler üniversitenin resmi web sitesinden **web scraping** yöntemiyle çekilir, yapılandırılmış JSON formatında saklanır ve Next.js 16 altyapısı ile kullanıcıya sunulur.

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
-   **İkonlar**: [Lucide React](https://lucide.dev/) - SVG'ler
-   **Veritabanı**: [NeonDB](https://neon.tech/) (Serverless PostgreSQL)
-   **Animasyonlar**: [Framer Motion](https://www.framer.com/motion/)
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
│   └── ui/               # Temel UI elementleri (Button, Card, Like/Dislike vb.)
├── lib/                  # Yardımcı fonksiyonlar ve iş mantığı
│   ├── db.ts             # NeonDB veritabanı bağlantısı
│   ├── rate-limiter.ts   # IP tabanlı rate limiting
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
git clone https://github.com/umutcandev/cukurova-yemekhane.git
cd cukurova-yemekhane
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
# veya
pnpm install
```

### 3. Environment Değişkenlerini Ayarlayın
Like/Dislike özelliği için NeonDB bağlantısı gereklidir:

```bash
cp .env.example .env.local
```

Sonra `.env.local` dosyasındaki `DATABASE_URL` değerini [NeonDB Console](https://console.neon.tech)'dan aldığınız bağlantı URL'si ile değiştirin.

### 4. Veri Çekin (Scraping)
Uygulamayı çalıştırmadan önce güncel menü verisini çekmeniz gerekir. Bu işlem `public/data` klasörüne gerekli JSON dosyasını oluşturacaktır.

```bash
npm run scrape
```

### 5. Geliştirme Sunucusunu Başlatın
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

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
