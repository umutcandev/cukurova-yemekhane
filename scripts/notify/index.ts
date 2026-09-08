/**
 * Günlük E-posta Bildirim Çalıştırıcısı
 *
 * Bugünün menüsünü bir kez okur ve kayıtlı her bildirim kanalını sırayla
 * çalıştırır (favori eşleşmesi, alerjen uyarısı). Kanallar birbirinden
 * bağımsızdır: biri patlarsa diğeri yine çalışır, ama koşu hatalı sayılır.
 *
 * Kullanım (yerel): pnpm notify   (kuru koşu: pnpm notify:dry)
 *
 * Kullanım (production): node scripts/notify/index.mjs
 * Coolify'da app container'ı üzerinde scheduled task olarak çalışır; DB internal
 * ağdan erişildiği için dışarı açık olması gerekmez. Menü verisini repodan gelen
 * public/data/ dosyalarından okur, yani scrape commit'i deploy olduktan sonra çalışmalı.
 *
 * production'da `pnpm notify` ÇALIŞMAZ: runtime image'ı Next standalone çıktısı,
 * içinde ne bu TypeScript kaynağı ne de tsx var; pnpm kurulum denemek zorunda
 * kalır ve /app root'a ait olduğu için (container `nextjs` kullanıcısıyla koşar)
 * ERR_PNPM_PACKAGE_MANAGER_CREATE_SLOT_DIR ile düşer. Bu dosya build sırasında
 * (Dockerfile'daki `pnpm build:notify`) tek bir .mjs'e paketlenir ve scheduled
 * task doğrudan node ile o bundle'ı çağırır.
 *
 * Gerekli env variables (app'in Coolify environment'ından miras alınır):
 *   DATABASE_URL, SMTP_USER, SMTP_PASS
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../lib/db/schema.js";
import { DATE_OVERRIDE, DRY_RUN, requireEnv } from "./env.js";
import { findTodayMenu, getTodayDateTR } from "./menu.js";
import { createMailer } from "./mailer.js";
import { loadAlreadySent, recordSent } from "./log.js";
import { maskEmail } from "./format.js";
import { favoritesChannel } from "./channels/favorites.js";
import { allergensChannel } from "./channels/allergens.js";
import type { NotificationChannel } from "./types.js";

/** Yeni bir bildirim türü eklemek = bir kanal yazıp bu listeye koymak. */
const CHANNELS: NotificationChannel[] = [favoritesChannel, allergensChannel];

const { databaseUrl, smtpUser, smtpPass } = requireEnv();

const pool = new pg.Pool({ connectionString: databaseUrl });
const db = drizzle(pool, { schema });
const mailer = createMailer({ user: smtpUser, pass: smtpPass, dryRun: DRY_RUN });

async function main() {
    const today = DATE_OVERRIDE ?? getTodayDateTR();
    if (DATE_OVERRIDE) {
        console.log(`🧪 Tarih elle verildi: ${DATE_OVERRIDE}`);
    }
    if (DRY_RUN) {
        console.log(
            "🧪 DRY RUN — eşleştirme yapılacak, hiçbir e-posta gönderilmeyecek\n"
        );
    }
    console.log(`📅 Tarih: ${today}\n`);

    const menu = findTodayMenu(today);
    if (!menu) {
        console.log("ℹ️ Bugün için menü bulunamadı, bildirim gönderilmeyecek.");
        return;
    }

    console.log(`🍽️ Bugünkü menüde ${menu.meals.length} yemek var:`);
    menu.meals.forEach((m) => console.log(`   - [${m.id}] ${m.name}`));

    let brokenChannels = 0;

    for (const channel of CHANNELS) {
        console.log(`\n── ${channel.label} ──\n`);
        try {
            const { emails, skipped, failed } = await channel.collect({
                db,
                menu,
                today,
            });

            // Tekrar koruması kanalın değil çalıştırıcının işi: yeni bir kanal
            // yazan kişinin bunu hatırlaması gerekmesin.
            //
            // Log OKUNAMAZSA gönderim durmaz. Bu sorgunun tek gerçekçi hata
            // sebebi tablonun henüz olmaması (migration deploy'dan sonra
            // uygulanmışsa); o gün kimseye mail gitmemesindense tekrar riskini
            // almak yeğdir. Aynı gerekçe kaydın gönderimden SONRA yazılmasında
            // da geçerli: kaçırılan uyarı, tekrarlanan uyarıdan kötüdür.
            let alreadySent: ReadonlySet<string> = new Set();
            try {
                alreadySent = await loadAlreadySent(db, channel.id, today);
            } catch (err) {
                console.error(
                    "   ⚠️  Gönderim kaydı okunamadı, tekrar koruması olmadan devam ediliyor:",
                    err
                );
                brokenChannels++;
            }

            const pending = emails.filter((e) => !alreadySent.has(e.userId));
            const duplicates = emails.length - pending.length;

            if (duplicates > 0) {
                console.log(
                    `   ⏭️  ${duplicates} kullanıcıya bugün zaten gönderilmiş, tekrarlanmıyor`
                );
            }

            let sent = 0;
            let sendErrors = 0;

            for (const email of pending) {
                try {
                    await mailer.send(email);
                    console.log(`   ✅ ${maskEmail(email.to)} — ${email.summary}`);
                    sent++;
                } catch (err) {
                    // Tek bir adresin reddedilmesi kuyruğun kalanını durdurmaz.
                    // Kayıt yazılmadığı için sıradaki koşuda tekrar denenir.
                    console.error(`   ❌ Gönderilemedi (${maskEmail(email.to)}):`, err);
                    sendErrors++;
                    continue;
                }

                // Kayıt AYRI bir try içinde: mail gitti, kaydı yazamamak
                // gönderimi başarısız yapmaz — sadece yarın tekrar gitme
                // riski doğurur, ki bu sessizce yutulacak bir şey değil.
                // Dry run hiçbir şey göndermediği için hiçbir şey de kaydetmez;
                // yoksa kuru koşu gerçek koşuyu susturur.
                if (DRY_RUN) continue;
                try {
                    await recordSent(db, channel.id, today, email.userId);
                } catch (err) {
                    console.error(
                        `   ⚠️  Mail gitti ama kaydedilemedi (${maskEmail(email.to)}) — tekrar gönderilebilir:`,
                        err
                    );
                    sendErrors++;
                }
            }

            console.log(
                `\n📊 ${channel.label}: ${sent} e-posta gönderildi, ${skipped + duplicates} atlandı` +
                    (failed + sendErrors > 0 ? `, ${failed + sendErrors} hata` : "")
            );
            if (failed + sendErrors > 0) brokenChannels++;
        } catch (err) {
            // Kanal izolasyonu: bir kanalın hazırlık sorgusu patlarsa (DB
            // timeout vb.) sıradaki kanal yine çalışmalı — alerjen uyarısının
            // favori bildirimine takılıp gitmemesi bu bloğa bağlı.
            console.error(`❌ "${channel.label}" kanalı çalışmadı:`, err);
            brokenChannels++;
        }
    }

    if (brokenChannels > 0) {
        // Coolify'ın task loglarında koşunun sessizce yeşil görünmemesi için.
        process.exitCode = 1;
    }
}

main()
    .catch((err) => {
        console.error("❌ Script hatası:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
