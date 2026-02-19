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

---

## Özellikler

- **Günlük Menü Görüntüleme**: Yemekhane menüleri gün gün kartlarda listelenir; her yemek için kalori bilgisi gösterilir.
- **Like / Dislike Sistemi**: Kullanıcılar oturum açmadan menüleri beğenebilir veya beğenmeyebilir. IP tabanlı rate limiting uygulanır.
- **Aylık En Beğenilen / En Beğenilmeyen Menüler**: Geçmiş ayın en çok ve en az beğenilen menüleri drawer içerisinde sıralama ile gösterilir.
- **Google ile Oturum Açma**: NextAuth.js (Auth.js v5) ve Google OAuth kullanılarak JWT tabanlı kimlik doğrulama.
- **Favori Yemekler**: Oturum açan kullanıcılar yemekleri favorilere ekleyip çıkarabilir. Ayrı `/favorilerim` sayfası üzerinden yönetim.
- **Kalori Takibi**: Kullanıcılar günde yedikleri yemekleri işaretleyerek toplam kalori takibi yapabilir. Tüm günlük loglar `/kalori-takibi` sayfasında listelenir.
- **Yemek Detay Modalı**: Herhangi bir yemeğe tıklandığında malzeme listesi ve görseli scrape edilerek modal/drawer ile gösterilir.
- **Menü Paylaşımı**: Seçili günün menüsü görsel olarak oluşturulur (`html-to-image`), indirilebilir veya paylaşım API'si ile gönderilebilir.
- **AI Prompt Üretimi**: Menü kartı üzerinden ChatGPT, Claude, Grok ve Perplexity gibi AI araçlar için hazır prompt oluşturulur.
- **PWA Desteği**: Uygulama Progressive Web App olarak yüklenebilir; offline destek için Service Worker kullanılır.
- **Karanlık / Aydınlık Tema**: `next-themes` ile sistem tercihine uyumlu tema desteği.
- **Takvim ile Tarih Seçimi**: Mobilde bottom sheet, masaüstünde dialog olarak tarih aralığı seçimi yapılabilir.
- **Mobil Alt Navigasyon**: Günler arası geçiş, tarih bilgisi ve son güncelleme durumu sabit alt barda gösterilir.
- **PWA Kurulum Bannerı**: Mobil cihazlarda uygulama kurulum teklifini gösteren banner.
- **Responsive Tasarım**: Masaüstü ve mobil için ayrı görünüm mantıkları (`useMediaQuery`, `useMobile`).
- **Otomatik Veri Güncelleme**: GitHub Actions ile her gün saat 07:00'de (UTC+3) menü verisi otomatik scrape edilir ve repo'ya commit atılır.
- **Vercel Analytics ve Google Analytics**: Kullanıcı etkileşimleri iki farklı analiz aracı ile izlenir.

---

## Teknik Mimari

Proje, **Extract-Transform-Load (ETL)** benzeri bir veri akışı üzerine kuruludur:

1.  **Veri Çekme (Scraping)**: Node.js tabanlı bir script (`scripts/scrape-menu.ts`), `cheerio` kütüphanesini kullanarak üniversitenin ASP tabanlı web sitesini tarar.
2.  **Veri İşleme (Parsing)**: Gelen ham HTML verisi, `iconv-lite` kullanılarak `Windows-1254` formatından `UTF-8`'e dönüştürülür ve DOM üzerinden gün, yemek ve kalori bilgileri ayrıştırılır.
3.  **Veri Saklama (Storage)**: İşlenen veriler `public/data/<YYYY-MM>/` dizinine tarih damgalı JSON dosyaları (örn. `menu-20260219.json`) olarak kaydedilir. Her ay klasöründe en fazla 5 dosya tutulur; eski dosyalar otomatik silinir.
4.  **Sunum (Presentation)**: Next.js uygulaması, bu statik JSON dosyalarını okuyarak sunucu tarafında (Server Components) render eder ve istemciye gönderir.

---

## Teknoloji Yığını

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components)
-   **UI Library**: [React 19](https://react.dev/)
-   **Dil**: [TypeScript](https://www.typescriptlang.org/)
-   **Stil**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Komponent Kütüphanesi**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
-   **İkonlar**: [Lucide React](https://lucide.dev/)
-   **Veritabanı**: [NeonDB](https://neon.tech/) (Serverless PostgreSQL)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/) + Drizzle Kit
-   **Kimlik Doğrulama**: [NextAuth.js v5](https://authjs.dev/) (Auth.js) + Google OAuth
-   **Animasyonlar**: [Framer Motion](https://www.framer.com/motion/)
-   **Scraping**: `cheerio`, `iconv-lite`
-   **Görsel Oluşturma**: `html-to-image`
-   **Takvim**: `react-day-picker`, `date-fns`
-   **Form ve Validasyon**: `react-hook-form`, `zod`
-   **Bildirimler**: `sonner`
-   **PWA**: `@ducanh2912/next-pwa`
-   **Analitik**: `@vercel/analytics`, `@next/third-parties` (Google Analytics)
-   **Paket Yöneticisi**: pnpm

---

## Proje Yapısı

```
cu-yemekhane/
├── app/                          # Next.js App Router
│   ├── api/                      # API rotaları
│   │   ├── auth/[...nextauth]/   # NextAuth.js handler
│   │   ├── reactions/            # Like/Dislike işlemleri
│   │   │   ├── route.ts          # GET & POST /api/reactions
│   │   │   └── monthly/route.ts  # GET /api/reactions/monthly
│   │   ├── favorites/route.ts    # GET & POST /api/favorites
│   │   ├── daily-log/            # Kalori takibi
│   │   │   ├── route.ts          # GET & POST /api/daily-log
│   │   │   └── all/route.ts      # GET /api/daily-log/all
│   │   ├── meal/[id]/route.ts    # GET /api/meal/:id (yemek detayı)
│   │   └── menu/date/[date]/     # GET /api/menu/date/:date
│   ├── favorilerim/page.tsx      # Favori yemekler sayfası
│   ├── kalori-takibi/page.tsx    # Kalori takibi sayfası
│   ├── menu-page.tsx             # Ana menü görünümü (Client Component)
│   ├── page.tsx                  # Ana sayfa (Server Component)
│   ├── layout.tsx                # Root layout (tema, session, analitik)
│   ├── manifest.ts               # PWA manifest
│   └── globals.css               # Global stiller
├── components/                   # UI bileşenleri
│   ├── ui/                       # shadcn/ui temel komponentleri
│   ├── menu-card.tsx             # Günlük menü kartı
│   ├── like-dislike-buttons.tsx  # Beğeni/beğenmeme butonları
│   ├── monthly-favorites.tsx     # Aylık en beğenilen menüler
│   ├── menu-share-bar.tsx        # Menü paylaşım aracı
│   ├── meal-detail-modal.tsx     # Yemek detay modalı
│   ├── auth-button.tsx           # Giriş/profil butonu ve dropdown
│   ├── auth-drawer.tsx           # Giriş gerektiren işlem için drawer
│   ├── favorite-button.tsx       # Favorilere ekleme butonu
│   ├── add-meal-button.tsx       # "Bunu yedim" butonu
│   ├── date-picker.tsx           # Takvim tarih seçici
│   ├── mobile-bottom-nav.tsx     # Mobil alt navigasyon
│   ├── pwa-install-banner.tsx    # PWA kurulum bannerı
│   ├── info-dialog.tsx           # Uygulama bilgi diyaloğu
│   ├── theme-toggle.tsx          # Tema değiştirici
│   └── theme-provider.tsx        # Tema sağlayıcısı
├── hooks/                        # Özel React hook'ları
│   ├── use-daily-log.ts          # Kalori takibi (add/remove/isConsumed)
│   ├── use-favorites.ts          # Favoriler (toggle/isFavorited)
│   ├── use-media-query.ts        # Medya sorgusu
│   ├── use-mobile.ts             # Mobil algılama
│   ├── use-pwa-install.ts        # PWA kurulum durumu
│   └── use-toast.ts              # Bildirim hook'u
├── lib/                          # Yardımcı fonksiyonlar ve iş mantığı
│   ├── auth.ts                   # NextAuth.js yapılandırması
│   ├── db.ts                     # NeonDB bağlantı (raw SQL)
│   ├── db/
│   │   ├── index.ts              # Drizzle ORM bağlantısı
│   │   └── schema.ts             # Veritabanı şemaları
│   ├── menu-loader.ts            # JSON dosya okuma işlemleri
│   ├── scraper.ts                # Cheerio ile HTML parse mantığı
│   ├── rate-limiter.ts           # IP tabanlı rate limiting
│   ├── date-utils.ts             # Tarih yardımcı fonksiyonları
│   ├── types.ts                  # TypeScript tip tanımları
│   └── utils.ts                  # Genel yardımcı fonksiyonlar
├── scripts/
│   └── scrape-menu.ts            # Scraper CLI scripti
├── public/
│   └── data/                     # Scrape edilen JSON menü dosyaları
│       └── <YYYY-MM>/            # Aylık klasörler (örn. 2026-02/)
│           └── menu-YYYYMMDD.json
├── .github/
│   ├── workflows/
│   │   └── menu-update.yml       # Günlük otomatik scraping
│   ├── CONTRIBUTING.md
│   └── SECURITY.md
├── middleware.ts                  # Korumalı rota middleware'i
├── drizzle.config.ts             # Drizzle Kit yapılandırması
├── next.config.mjs               # Next.js + PWA yapılandırması
└── ...diğer konfigürasyonlar
```

---

## API Rotaları

| Rota | Metot | Açıklama | Kimlik Doğrulama |
|------|-------|----------|------------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js handler (Google OAuth) | - |
| `/api/reactions?date=YYYY-MM-DD` | GET | Belirtilen günün beğeni sayılarını getirir | Hayır |
| `/api/reactions` | POST | Beğeni/beğenmeme işlemi (like, dislike, removeLike, removeDislike) | Hayır (rate limited) |
| `/api/reactions/monthly?month=YYYY-MM` | GET | Ayın en beğenilen ve en beğenilmeyen 5 menüsünü getirir | Hayır |
| `/api/favorites` | GET | Kullanıcının favori yemek listesini getirir | Evet |
| `/api/favorites` | POST | Favori yemek ekle/çıkar (toggle) | Evet |
| `/api/daily-log?date=YYYY-MM-DD` | GET | Belirtilen gündeki tüketilen yemekleri getirir | Evet |
| `/api/daily-log` | POST | Yemek ekle/çıkar (action: add/remove) | Evet |
| `/api/daily-log/all` | GET | Kullanıcının tüm günlük loglarını getirir | Evet |
| `/api/meal/:id` | GET | Yemek detayını scrape eder (malzemeler, görsel) | Hayır |
| `/api/menu/date/:date` | GET | Belirtilen tarihteki menüyü tüm ay klasörlerinden arar | Hayır |

---

## Veritabanı Şeması

Proje NeonDB (PostgreSQL) üzerinde Drizzle ORM ile çalışır. Schema dosyası: `lib/db/schema.ts`

### menu_reactions
Anonim like/dislike sayaçları. Oturum gerektirmez.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | serial | Birincil anahtar |
| menu_date | text (unique) | YYYY-MM-DD formatında menü tarihi |
| like_count | integer | Beğeni sayısı |
| dislike_count | integer | Beğenmeme sayısı |
| created_at | timestamp | Oluşturulma zamanı |
| updated_at | timestamp | Son güncelleme zamanı |

### users
NextAuth.js tarafından yönetilen kullanıcı tablosu.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | text | UUID birincil anahtar |
| name | text | Kullanıcı adı |
| email | text (unique) | E-posta adresi |
| emailVerified | timestamp | E-posta doğrulama zamanı |
| image | text | Profil görseli URL'si |

### accounts
OAuth hesap bağlantıları (Google).

### sessions
Oturum yönetimi.

### verificationTokens
E-posta doğrulama token'ları.

### favorites
Kullanıcıların favori yemekleri.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | serial | Birincil anahtar |
| user_id | text (FK -> users) | Kullanıcı ID |
| meal_name | text | Yemek adı |
| created_at | timestamp | Eklenme zamanı |

Benzersiz index: `(user_id, meal_name)`

### daily_logs
Günlük kalori takibi kayıtları.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | serial | Birincil anahtar |
| user_id | text (FK -> users) | Kullanıcı ID |
| date | date | Tarih |
| total_calories | integer | Toplam kalori |
| consumed_meals | jsonb | Tüketilen yemekler dizisi `[{mealName, calories}]` |

Benzersiz index: `(user_id, date)`

---

## Korumalı Rotalar

Middleware (`middleware.ts`), aşağıdaki rotalara erişimi oturum açmamış kullanıcılar için engeller ve ana sayfaya yönlendirir:

- `/favorilerim`
- `/kalori-takibi`

---

## GitHub Actions

Projede `.github/workflows/menu-update.yml` dosyasında tanımlanan bir GitHub Actions workflow'u bulunur:

- **Tetikleme**: Her gün UTC 04:00'te (Türkiye saati 07:00) ve manuel (`workflow_dispatch`).
- **İşlem**: Repoyu checkout eder, Node.js kurar, bağımlılıkları yükler, `npm run scrape` çalıştırır.
- **Sonuç**: Yeni veri varsa `public/data/` dizinindeki değişiklikleri otomatik olarak commit ve push eder.

---

## Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/umutcandev/cukurova-yemekhane.git
cd cukurova-yemekhane
```

### 2. Bağımlılıkları Yükleyin
```bash
pnpm install
```

### 3. Environment Değişkenlerini Ayarlayın

```bash
cp .env.example .env.local
```

`.env.local` dosyasındaki değişkenleri yapılandırın:

| Değişken | Açıklama | Nereden Alınır |
|----------|----------|----------------|
| `DATABASE_URL` | NeonDB PostgreSQL bağlantı URL'si | [NeonDB Console](https://console.neon.tech) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ölçüm ID'si | [Google Analytics](https://analytics.google.com) |
| `NEXTAUTH_SECRET` | NextAuth.js oturum şifresi | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Uygulama URL'si (yerel: `http://localhost:3000`) | - |
| `GOOGLE_CLIENT_ID` | Google OAuth istemci ID'si | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth istemci şifresi | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

### 4. Veritabanını Hazırlayın
Drizzle ORM ile veritabanı şemalarını oluşturun:
```bash
npx drizzle-kit push
```

### 5. Veri Çekin (Scraping)
Uygulamayı çalıştırmadan önce güncel menü verisini çekin:
```bash
pnpm scrape
```

### 6. Geliştirme Sunucusunu Başlatın
```bash
pnpm dev
```
Tarayıcınızda `http://localhost:3000` adresine giderek uygulamayı görüntüleyebilirsiniz.

---

## Veri Modeli

Scraper tarafından oluşturulan JSON verisi şu yapıdadır:

```typescript
interface MenuData {
  month: string;          // "2026-02"
  lastUpdated: string;    // ISO Date
  scrapeDate: string;     // "2026-02-19"
  totalDays: number;
  days: DayMenu[];
}

interface DayMenu {
  ymk: number;            // Yemekhane sistemindeki ID
  date: string;           // "2026-02-19"
  dayName: string;        // "Çarşamba"
  hasData: boolean;       // Menü verisi var mı
  totalCalories: number;
  meals: Meal[];
}

interface Meal {
  id: string;             // "157"
  name: string;           // "Ekşili Köfte"
  calories: number;       // 294
  category: MealCategory;
}

type MealCategory =
  | "ana_yemek"
  | "yan_yemek"
  | "corba"
  | "yan_urun"
  | "tatli"
  | "icecek";

interface MealDetail {
  id: string;
  name: string;
  calories: number;
  imageUrl: string | null;
  ingredients: Ingredient[];
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}
```

---

## Veri Dizin Yapısı

Menü verileri aylık klasörlerde saklanır. Her klasörde en fazla 5 JSON dosyası tutulur:

```
public/data/
├── 2026-01/
│   ├── menu-20260131.json
│   └── ...
└── 2026-02/
    ├── menu-20260215.json
    ├── menu-20260216.json
    ├── menu-20260217.json
    ├── menu-20260218.json
    └── menu-20260219.json
```

Dosya adlandırma formatı: `menu-YYYYMMDD.json` (scrape tarihine göre).

---

## Kullanılan Scriptler

| Script | Komut | Açıklama |
|--------|-------|----------|
| `dev` | `pnpm dev` | Geliştirme sunucusunu başlatır |
| `build` | `pnpm build` | Üretim derlemesi oluşturur |
| `start` | `pnpm start` | Üretim sunucusunu başlatır |
| `lint` | `pnpm lint` | ESLint ile kod kontrolü |
| `scrape` | `pnpm scrape` | Menü verisini scrape eder |

---

## Katkı

Projeye katkı sağlamak için [CONTRIBUTING.md](.github/CONTRIBUTING.md) dosyasına bakınız.

## Güvenlik

Güvenlik açıkları için [SECURITY.md](.github/SECURITY.md) dosyasına bakınız.

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
