/**
 * Bildirim çalıştırıcısını production image'ı için tek dosyaya paketler.
 *
 * Neden bir bundle? Runtime image'ı Next'in `standalone` çıktısı: içinde ne
 * scripts/ kaynağı, ne tsx, ne de pnpm'in yazabileceği bir node_modules var
 * (container `nextjs` kullanıcısıyla koşuyor, /app root'a ait). Orada
 * `pnpm notify` demek pnpm'i kurulum yapmaya zorluyor ve iş
 * ERR_PNPM_PACKAGE_MANAGER_CREATE_SLOT_DIR / EACCES ile düşüyor.
 *
 * Çıktı .next/standalone içine yazılır, oradan image'a Dockerfile'ın mevcut
 * standalone COPY'siyle girer. Scheduled task komutu:
 *   node scripts/notify/index.mjs
 */

import { build } from "esbuild";

/**
 * Bağımlılıklar bundle'a GÖMÜLÜR, standalone'un node_modules'ından çözülmez:
 * Next sunucu kodunu kendi paketlediği için drizzle-orm ve nodemailer trace
 * çıktısında hiç yok (yalnızca pg var). Kendi kendine yeten bundle, bu trace
 * davranışı değiştiğinde sabah 06:00'daki cron'un patlamasını da engeller.
 */
await build({
    entryPoints: ["scripts/notify/index.ts"],
    outfile: ".next/standalone/scripts/notify/index.mjs",
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    /**
     * pg bunları isteğe bağlı olarak, try/catch içinde çağırır; ikisi de
     * kurulu değil ve olmaları da gerekmiyor.
     */
    external: ["pg-native", "cloudflare:sockets"],
    /**
     * ESM çıktının içine giren CJS paketleri (pg, nodemailer) builtin'leri
     * require() ile alıyor. Ambient bir `require` tanımlanmazsa esbuild'in
     * shim'i "Dynamic require of 'events' is not supported" diye düşer.
     */
    banner: {
        js: `import { createRequire as __notifyCreateRequire } from "node:module";\nconst require = __notifyCreateRequire(import.meta.url);`,
    },
});
