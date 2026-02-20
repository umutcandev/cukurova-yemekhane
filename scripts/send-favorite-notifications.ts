/**
 * Favori Yemek E-posta Bildirim Scripti
 *
 * Bu script GitHub Actions'ta scrape step'inden sonra çalışır.
 * Bugünkü menüdeki yemekleri, kullanıcıların favorileriyle eşleştirir
 * ve eşleşme varsa Google SMTP üzerinden e-posta gönderir.
 *
 * Kullanım: npx tsx scripts/send-favorite-notifications.ts
 *
 * Gerekli env variables, bizim senaryomuzda github actions için Github repository secret olarak tanımlı:
 *   DATABASE_URL, SMTP_USER, SMTP_PASS
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, isNotNull } from "drizzle-orm";
import * as schema from "../lib/db/schema.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ──────────────────────────────────────────
// Config
// ──────────────────────────────────────────

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const DATABASE_URL = process.env.DATABASE_URL;
const SITE_URL = "https://cukurova.app";

if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is required");
    process.exit(1);
}

if (!SMTP_USER || !SMTP_PASS) {
    console.error("❌ SMTP_USER and SMTP_PASS are required");
    process.exit(1);
}

// ──────────────────────────────────────────
// DB Setup
// ──────────────────────────────────────────

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

// ──────────────────────────────────────────
// SMTP Setup
// ──────────────────────────────────────────

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

interface MealData {
    id: string;
    name: string;
    calories: number;
}

interface DayData {
    date: string;
    dayName: string;
    hasData: boolean;
    meals: MealData[];
}

interface MenuData {
    month: string;
    days: DayData[];
}

/**
 * Bugünün tarihini Türkiye saatine göre YYYY-MM-DD formatında döndürür
 */
function getTodayDateTR(): string {
    const now = new Date();
    const trDate = new Date(
        now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" })
    );
    const year = trDate.getFullYear();
    const month = String(trDate.getMonth() + 1).padStart(2, "0");
    const day = String(trDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Bugünün menüsünü JSON dosyalarından bulur
 */
function findTodayMenu(today: string): DayData | null {
    const month = today.substring(0, 7); // "2026-02"
    const monthDir = path.join(__dirname, "..", "public", "data", month);

    if (!fs.existsSync(monthDir)) {
        console.log(`📁 Ay klasörü bulunamadı: ${month}`);
        return null;
    }

    // En son JSON dosyasını bul
    const files = fs
        .readdirSync(monthDir)
        .filter((f) => f.startsWith("menu-") && f.endsWith(".json"))
        .sort()
        .reverse();

    if (files.length === 0) {
        console.log(`📄 JSON dosyası bulunamadı: ${monthDir}`);
        return null;
    }

    const latestFile = path.join(monthDir, files[0]);
    const content = fs.readFileSync(latestFile, "utf-8");
    const menuData: MenuData = JSON.parse(content);

    const todayMenu = menuData.days.find((d) => d.date === today);
    if (!todayMenu || !todayMenu.hasData) {
        console.log(`📅 Bugün (${today}) için menü verisi yok`);
        return null;
    }

    return todayMenu;
}

/**
 * Yemek adını title case'e çevirir
 */
function toTitleCase(str: string): string {
    return str
        .toLocaleLowerCase("tr-TR")
        .replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase("tr-TR"));
}

/**
 * HTML e-posta şablonu
 */
function buildEmailHtml(
    userName: string,
    matchedMeals: MealData[],
    today: string
): string {
    const mealList = matchedMeals
        .map((m) => `<li style="padding: 4px 0;">${toTitleCase(m.name)} <span style="color: #888;">(${m.calories} kcal)</span></li>`)
        .join("");

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h3 style="color: #1a1a1a; margin-bottom: 4px;">Favori yemeğiniz bugün Çukurova Üniversitesi Yemekhane menüsünde!</h3>
        <p style="color: #666; font-size: 13px; margin-top: 0;">${today}</p>

        <p style="color: #333; font-size: 14px;">
            Merhaba <strong>${userName}</strong>,
        </p>

        <p style="color: #333; font-size: 14px;">
            Bugünkü menüde favorilediğiniz yemekler var:
        </p>

        <ul style="list-style: disc; padding-left: 20px; margin: 16px 0; font-size: 14px;">
            ${mealList}
        </ul>

        <a href="${SITE_URL}" style="display: inline-block; background: #18181b; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500;">
            Menüyü Görüntüle
        </a>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

        <p style="color: #999; font-size: 11px;">
            Bu e-postayı <a href="${SITE_URL}" style="color: #999;">cukurova.app</a> üzerinden favori bildirimlerini 
            açtığınız için alıyorsunuz. Bildirimleri kapatmak için 
            <a href="${SITE_URL}/favorilerim" style="color: #999;">Favorilerim</a> sayfasını ziyaret edin.
        </p>
    </div>
    `;
}

// ──────────────────────────────────────────
// Main
// ──────────────────────────────────────────

async function main() {
    const today = getTodayDateTR();
    console.log(`📅 Tarih: ${today}\n`);

    // 1. Bugünün menüsünü bul
    const todayMenu = findTodayMenu(today);
    if (!todayMenu) {
        console.log("ℹ️ Bugün için menü bulunamadı, bildirim gönderilmeyecek.");
        return;
    }

    const todayMealIds = todayMenu.meals.map((m) => m.id);
    console.log(`🍽️ Bugünkü menüde ${todayMealIds.length} yemek var:`);
    todayMenu.meals.forEach((m) =>
        console.log(`   - [${m.id}] ${m.name}`)
    );
    console.log();

    // 2. Bildirim almak isteyen kullanıcıları çek
    const subscribedUsers = await db
        .select({
            userId: schema.emailPreferences.userId,
        })
        .from(schema.emailPreferences)
        .where(eq(schema.emailPreferences.notifyFavorites, true));

    if (subscribedUsers.length === 0) {
        console.log("ℹ️ Bildirim almak isteyen kullanıcı yok.");
        return;
    }

    console.log(`👥 ${subscribedUsers.length} kullanıcı bildirim almak istiyor.\n`);

    // 3. Her kullanıcı için eşleştirme yap
    let sentCount = 0;
    let skipCount = 0;

    for (const sub of subscribedUsers) {
        try {
            // Kullanıcı bilgilerini çek
            const userResult = await db
                .select({ name: schema.users.name, email: schema.users.email })
                .from(schema.users)
                .where(eq(schema.users.id, sub.userId));

            if (userResult.length === 0 || !userResult[0].email) {
                console.log(`   ⚠️ Kullanıcı bulunamadı veya e-posta yok: ${sub.userId}`);
                skipCount++;
                continue;
            }

            const user = userResult[0];

            // Kullanıcının favorilerini çek (meal_id'si olanlar)
            const userFavorites = await db
                .select({
                    mealId: schema.favorites.mealId,
                    mealName: schema.favorites.mealName,
                })
                .from(schema.favorites)
                .where(
                    and(
                        eq(schema.favorites.userId, sub.userId),
                        isNotNull(schema.favorites.mealId)
                    )
                );

            if (userFavorites.length === 0) {
                skipCount++;
                continue;
            }

            // Eşleştirme
            const matchedFavIds = userFavorites
                .filter((f) => f.mealId && todayMealIds.includes(f.mealId))
                .map((f) => f.mealId!);

            if (matchedFavIds.length === 0) {
                skipCount++;
                continue;
            }

            // Eşleşen yemeklerin detaylarını menüden al
            const matchedMeals = todayMenu.meals.filter((m) =>
                matchedFavIds.includes(m.id)
            );

            // E-posta gönder
            const html = buildEmailHtml(
                user.name || "Kullanıcı",
                matchedMeals,
                today
            );

            await transporter.sendMail({
                from: `"Çukurova Yemekhane" <${SMTP_USER}>`,
                to: user.email!,
                subject: "Favori yemeğiniz bugün yemekhane menüsünde!",
                html,
            });

            console.log(`   ✅ ${user.email} — ${matchedMeals.map((m) => m.name).join(", ")}`);
            sentCount++;

            // Rate limiting: 200ms bekle
            await new Promise((r) => setTimeout(r, 200));
        } catch (err) {
            console.error(`   ❌ Hata (${sub.userId}):`, err);
        }
    }

    console.log(`\n📊 Sonuç: ${sentCount} e-posta gönderildi, ${skipCount} atlandı.`);
}

main().catch((err) => {
    console.error("❌ Script hatası:", err);
    process.exit(1);
});
