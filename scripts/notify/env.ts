/**
 * Bildirim çalıştırıcısının ortam ve CLI ayarları — tek yerde okunur ki
 * kanallar env'e doğrudan uzanmasın.
 */

export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const DATABASE_URL = process.env.DATABASE_URL;

export const SITE_URL = "https://cukurova.app";

/**
 * --dry-run: eşleştirmeyi yapar, kime ne gideceğini basar, MAIL GÖNDERMEZ.
 * Bildirim mantığını gerçek kullanıcılara spam atmadan doğrulamak için.
 */
export const DRY_RUN = process.argv.includes("--dry-run");

/** --date=YYYY-MM-DD: bugün yerine belirtilen günün menüsüyle çalışır (test için). */
export const DATE_OVERRIDE = process.argv
    .find((arg) => arg.startsWith("--date="))
    ?.slice("--date=".length);

/**
 * Eksik env ile başlamak, yarım gönderilmiş bir koşudan iyidir: kanallar
 * çalışmadan önce burada durulur.
 */
export function requireEnv(): {
    databaseUrl: string;
    smtpUser: string;
    smtpPass: string;
} {
    if (!DATABASE_URL) {
        console.error("❌ DATABASE_URL is required");
        process.exit(1);
    }
    if (!SMTP_USER || !SMTP_PASS) {
        console.error("❌ SMTP_USER and SMTP_PASS are required");
        process.exit(1);
    }
    return {
        databaseUrl: DATABASE_URL,
        smtpUser: SMTP_USER,
        smtpPass: SMTP_PASS,
    };
}
