![Çukurova Üniversitesi Yemekhane](public/github-banner.png)

A modern web application for viewing daily meal menus at Çukurova University's cafeteria. Menu data is collected from the university's official website via web scraping, stored in structured JSON format, and served to users.

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?logo=shadcnui&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?logo=radix-ui&logoColor=white)

Live: [https://cukurova.app](https://cukurova.app)

## Features

- **Daily Menu**: Day-by-day menu cards with calorie info and meal details (ingredients and images)
- **Menu Search**: Search past menus by meal name via command palette
- **Menu Sharing**: Generate shareable images with `html-to-image`, download or copy to clipboard
- **AI Menu Analysis**: Ready-made prompts for ChatGPT, Claude, Grok, and Perplexity
- **Like / Dislike**: One reaction per user per menu, rate-limited
- **Favorites**: Favorite meals, `/favorilerim` page, email notifications when a favorite meal appears on the menu
- **Calorie Tracking**: Daily meal logging, calorie goal setting, pie chart visualization, `/kalori-takibi` page
- **Comments**: Date-based comments with threading (replies), photo uploads (Cloudflare R2), real-time polling, profanity filter, XSS protection
- **Comment Moderation**: Delete by author or moderator, reporting with email notifications to moderator
- **Onboarding**: 5-step video guide after first login
- **Google Sign-In**: NextAuth.js v5 + Google OAuth (JWT)
- **Calendar**: Bottom sheet on mobile, dialog on desktop
- **Theming**: Dark / light mode with system preference detection
- **Responsive**: Separate views for desktop and mobile
- **Automation**: GitHub Actions for weekday menu scraping + favorite notifications
- **Rate Limiting**: API protection via Upstash Redis (distributed) or in-memory fallback
- **Analytics**: Google Analytics

## Architecture

**ETL**-like data pipeline:

1. **Scraping** — University's ASP site is parsed with `cheerio`
2. **Parsing** — `Windows-1254` → `UTF-8` conversion via `iconv-lite`, DOM extraction
3. **Storage** — `public/data/menu-YYYY-MM-YYYYMMDD.json` files
4. **Rendering** — Next.js Server Components

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI, Lucide React |
| Database | PostgreSQL, Drizzle ORM |
| Auth | NextAuth.js v5, Google OAuth |
| Storage | Cloudflare R2 (photo uploads) |
| Rate Limiting | Upstash Redis (optional, in-memory fallback) |
| Animation | Framer Motion |
| Charts | Recharts |
| Scraping | cheerio, iconv-lite |
| Email | nodemailer (Google SMTP) |
| Other | html-to-image, react-day-picker, date-fns, zod, sonner |
| Package Manager | pnpm |

## Quick Start

```bash
git clone https://github.com/umutcandev/cukurova-yemekhane.git
cd cukurova-yemekhane
pnpm install
cp .env.example .env.local   # Configure variables
npx drizzle-kit push          # Push database schema
pnpm scrape                   # Fetch menu data
pnpm dev                      # http://localhost:3000
```

For detailed configuration, see `.env.example`.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details.

## Security

For security concerns, please see [SECURITY.md](.github/SECURITY.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
