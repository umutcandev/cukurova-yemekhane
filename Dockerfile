# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ---- deps ----
# Sadece manifest + lockfile kopyalanır: kaynak kod değişse bile bu katman
# cache'ten gelir, pnpm install tekrar çalışmaz.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm config set store-dir /pnpm-store && \
    pnpm install --frozen-lockfile

# ---- builder ----
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* değişkenleri build sırasında client bundle'ına GÖMÜLÜR.
# Nixpacks bunları ortamdan otomatik alıyordu; Docker build almaz, bu yüzden
# ARG olarak açıkça geçilmeleri gerekir. Coolify tarafında bu üç değişkende
# "Build Variable / Available at Buildtime" işaretli olmalı.
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_PHOTO_UPLOAD_ENABLED
ARG NEXT_PUBLIC_PROFILE_CUSTOMIZATION_ENABLED
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_PHOTO_UPLOAD_ENABLED=$NEXT_PUBLIC_PHOTO_UPLOAD_ENABLED
ENV NEXT_PUBLIC_PROFILE_CUSTOMIZATION_ENABLED=$NEXT_PUBLIC_PROFILE_CUSTOMIZATION_ENABLED

# images.remotePatterns'a girdiği için buildtime'da da lazım.
ARG YEMEKHANE_ORIGIN
ENV YEMEKHANE_ORIGIN=$YEMEKHANE_ORIGIN

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# .next/cache cache mount'ta tutulur: sonraki build'lerde Next incremental
# derler. Bu mount image katmanına yazılmaz, sadece build sırasında yaşar.
RUN --mount=type=cache,id=next-cache,target=/app/.next/cache \
    pnpm build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# KRİTİK: `output: 'standalone'` çıktısı public/ klasörünü İÇERMEZ.
# Günlük scrape'in ürettiği menü JSON'ları public/data/ altında ve
# lib/menu-loader.ts bunları runtime'da diskten okuyor.
# Bu satır silinirse menüler boş gelir.
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
