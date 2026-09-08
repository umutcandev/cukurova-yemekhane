import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { DayData, MenuData } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * scripts/notify/ → repo kökü. Dosya taşınırsa bu derinlik güncellenmeli.
 * Production bundle'ı da aynı derinlikte durur (/app/scripts/notify/index.mjs
 * → /app/public/data), bu yüzden iki layout'ta da tek hesap yeter.
 */
const DATA_DIR = path.join(__dirname, "..", "..", "public", "data");

/**
 * Bugünün tarihini Türkiye saatine göre YYYY-MM-DD formatında döndürür
 */
export function getTodayDateTR(): string {
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
 * Bugünün menüsünü JSON dosyalarından bulur.
 * Flat yapı: public/data/menu-YYYY-MM-YYYYMMDD.json
 */
export function findTodayMenu(today: string): DayData | null {
    const month = today.substring(0, 7); // "2026-03"

    if (!fs.existsSync(DATA_DIR)) {
        console.log(`📁 data klasörü bulunamadı`);
        return null;
    }

    // Bu aya ait dosyaları bul, en yenisi önce (dosya adı sırasına göre)
    const files = fs
        .readdirSync(DATA_DIR)
        .filter((f) => f.startsWith(`menu-${month}-`) && f.endsWith(".json"))
        .sort()
        .reverse();

    if (files.length === 0) {
        console.log(`📄 ${month} ayına ait JSON dosyası bulunamadı`);
        return null;
    }

    console.log(`📂 Kullanılan dosya: ${files[0]}`);

    const latestFile = path.join(DATA_DIR, files[0]);
    const content = fs.readFileSync(latestFile, "utf-8");
    const menuData: MenuData = JSON.parse(content);

    const todayMenu = menuData.days.find((d) => d.date === today);
    if (!todayMenu || !todayMenu.hasData) {
        console.log(`📅 Bugün (${today}) için menü verisi yok`);
        return null;
    }

    return todayMenu;
}
