![Çukurova Üniversitesi Yemekhane](public/github-banner.png)

Çukurova Üniversitesi yemekhanesinin günlük yemek menülerini görüntülemek için geliştirilmiş, yüksek performanslı ve modern bir web uygulaması.

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?logo=shadcnui&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?logo=radix-ui&logoColor=white)

Canlı: [https://cukurova.app](https://cukurova.app)



Veriler üniversitenin resmi web sitesinden **web scraping** yöntemiyle çekilir, yapılandırılmış JSON formatında saklanır ve Next.js altyapısı ile kullanıcıya sunulur.

---

## Özellikler

| Özellik | Açıklama |
|---------|----------|
| Günlük Menü | Gün gün kartlarda menü listeleme, kalori bilgisi |
| Menü Arama | Geçmiş menülerde yemek adıyla arama |
| Like / Dislike | Kullanıcı başına bir reaksiyon, kimlik doğrulamalı sistem |
| Google Giriş | NextAuth.js v5 + Google OAuth (JWT) |
| Favoriler | Yemek favorileme, `/favorilerim` sayfası |
| E-posta Bildirimi | Favori yemek menüde olduğunda Google SMTP ile bildirim |
| Kalori Takibi | Günlük yemek işaretleme, kalori hedefi, `/kalori-takibi` sayfası |
| Yemek Detayı | Tıklama ile malzeme listesi ve görsel (scrape) |
| Menü Paylaşımı | `html-to-image` ile görsel oluşturma ve paylaşım |
| AI Prompt | ChatGPT, Claude, Grok, Perplexity için hazır prompt |
| Yorum Sistemi | Tarihe göre yorum yapma, sayfalama, gerçek zamanlı polling, küfür filtresi |
| Yorum Moderasyonu | Yorum silme (yazar veya moderatör), yorum raporlama + e-posta bildirimi |
| Tema | Karanlık / aydınlık, sistem tercihi uyumlu |
| Takvim | Mobilde bottom sheet, masaüstünde dialog |
| Responsive | Masaüstü ve mobil için ayrı görünümler |
| Otomasyon | GitHub Actions ile günlük scraping + favori bildirimi |
| Analitik | Google Analytics |

---

## Teknik Mimari

**ETL** benzeri veri akışı:

1. **Scraping** → `cheerio` ile üniversitenin ASP sitesi taranır
2. **Parsing** → `iconv-lite` ile `Windows-1254` → `UTF-8` dönüşümü, DOM ayrıştırma
3. **Storage** → `public/data/<YYYY-MM>/menu-YYYYMMDD.json` dosyaları (aylık maks. 5 dosya)
4. **Sunum** → Next.js Server Components ile render

---

## Teknoloji Yığını

| Kategori | Teknoloji |
|----------|-----------|
| Framework | Next.js (App Router), React 19, TypeScript |
| Stil | Tailwind CSS 4, shadcn/ui, Radix UI, Lucide React |
| Veritabanı | PostgreSQL, Drizzle ORM |
| Auth | NextAuth.js v5, Google OAuth |
| Animasyon | Framer Motion |
| Scraping | cheerio, iconv-lite |
| Diğer | html-to-image, react-day-picker, date-fns, react-hook-form, zod, sonner, nodemailer |
| Paket Yöneticisi | pnpm |

---

## Kurulum

```bash
git clone https://github.com/umutcandev/cukurova-yemekhane.git
cd cukurova-yemekhane
pnpm install
cp .env.example .env.local   # Değişkenleri yapılandır
npx drizzle-kit push          # Veritabanı şeması
pnpm scrape                   # Menü verisi çek
pnpm dev                      # http://localhost:3000
```

### Environment Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | PostgreSQL bağlantı URL'si |
| `NEXTAUTH_SECRET` | Oturum şifresi (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Uygulama URL'si |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `SMTP_USER` / `SMTP_PASS` | Google SMTP (bildirimler) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID |
| `NEXT_PUBLIC_AUTH_ENABLED` | Auth sistemini etkinleştirir/devre dışı bırakır (varsayılan: `true`) |
| `MODERATOR_EMAIL` | Raporlanan yorumların bildirileceği e-posta adresi |
| `MODERATOR_USER_ID` | Yorum silme yetkisine sahip moderatör kullanıcı ID'si |

---

## API Rotaları

| Rota | Metot | Açıklama | Auth |
|------|-------|----------|------|
| `/api/auth/[...nextauth]` | GET/POST | OAuth handler | - |
| `/api/reactions` | GET/POST | Like/dislike (kullanıcı başına) | Evet |
| `/api/favorites` | GET/POST | Favori yemek toggle | Evet |
| `/api/email-preferences` | GET/POST | E-posta bildirim tercihi | Evet |
| `/api/daily-log` | GET/POST | Günlük kalori kaydı | Evet |
| `/api/daily-log/all` | GET | Tüm günlük loglar | Evet |
| `/api/calorie-goal` | GET/POST | Kalori hedefi | Evet |
| `/api/meal/:id` | GET | Yemek detayı (scrape) | Hayır |
| `/api/menu/date/:date` | GET | Tarihe göre menü | Hayır |
| `/api/menu/search` | GET | Menü arama | Hayır |
| `/api/comments` | GET | Yorumları listele (`menuDate`, `limit`, `before`, `after`, `count` parametreleri) | Hayır |
| `/api/comments` | POST | Yorum ekle (max 200 karakter, küfür filtreli, XSS korumalı) | Evet |
| `/api/comments/[id]` | DELETE | Yorum sil (yazar veya moderatör) | Evet |
| `/api/comments/[id]/report` | POST | Yorum raporla | Evet |

---

## Veritabanı Şeması

Schema: `lib/db/schema.ts` — PostgreSQL + Drizzle ORM

| Tablo | Açıklama |
|-------|----------|
| `menu_reactions` | Anonim like/dislike sayaçları (`menu_date` unique) |
| `users` | NextAuth.js kullanıcı tablosu |
| `accounts` | OAuth hesap bağlantıları |
| `sessions` | Oturum yönetimi |
| `favorites` | Favori yemekler (`user_id` + `meal_name` unique) |
| `email_preferences` | E-posta bildirim tercihleri (`user_id` unique) |
| `daily_logs` | Günlük kalori kayıtları (`user_id` + `date` unique) |
| `user_reactions` | Kullanıcı başına like/dislike kaydı (`user_id` + `menu_date` unique) |
| `comments` | Tarihe göre kullanıcı yorumları (`menu_date` indexed) |
| `comment_reports` | Yorum şikayetleri (`comment_id` + `reporter_id` unique) |

---

## GitHub Actions

| Workflow | Dosya | Açıklama |
|----------|-------|----------|
| Menü Scrape | `menu-scrape.yml` | Her gün UTC 04:00'te menü scrape + commit |
| Bildirim | `menu-notify.yml` | Scrape sonrası favori e-posta bildirimi |
| CI | `ci.yml` | Sürekli entegrasyon |

Gerekli Secrets: `DATABASE_URL`, `SMTP_USER`, `SMTP_PASS`

---

## Scriptler

| Komut | Açıklama |
|-------|----------|
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm build` | Üretim derlemesi |
| `pnpm scrape` | Menü scraping |
| `npx tsx scripts/send-favorite-notifications.ts` | Favori e-posta bildirimi |

---

## Korumalı Rotalar

`middleware.ts` oturum açmamış kullanıcıları `/favorilerim` ve `/kalori-takibi` rotalarından ana sayfaya yönlendirir. `NEXT_PUBLIC_AUTH_ENABLED=false` yapıldığında middleware devre dışı kalır.

---

## Katkı

Projeye katkı sağlamak için [CONTRIBUTING.md](.github/CONTRIBUTING.md) dosyasına bakınız.

## Güvenlik

Güvenlik açıkları için [SECURITY.md](.github/SECURITY.md) dosyasına bakınız.

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
