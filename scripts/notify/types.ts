import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../lib/db/schema.js";
import type { AllergenHit, DietFlags } from "../../lib/allergens.js";

export type NotifyDb = NodePgDatabase<typeof schema>;

export interface MealData {
    id: string;
    name: string;
    calories: number;
    /** Build-time üretilen alerjen etiketleri; eski JSON dosyalarında yok */
    allergens?: AllergenHit[];
    unmappedIngredients?: string[];
    dietFlags?: DietFlags;
}

export interface DayData {
    date: string;
    dayName: string;
    hasData: boolean;
    meals: MealData[];
}

export interface MenuData {
    month: string;
    days: DayData[];
}

/** Kanalın ürettiği tek bir e-posta. Gönderimi kanal değil, çalıştırıcı yapar. */
export interface OutgoingEmail {
    /** Tekrar gönderim kaydı bunun üzerinden tutulur — adres değil, kimlik */
    userId: string;
    to: string;
    subject: string;
    html: string;
    /** Log satırında görünecek kısa özet (ör. eşleşen yemekler) */
    summary: string;
}

export interface ChannelResult {
    emails: OutgoingEmail[];
    /** Eşleşme çıkmadığı için mail üretilmeyen kullanıcı sayısı */
    skipped: number;
    /** Kendi hatasıyla atlanan kullanıcı sayısı — kanalı komple düşürmez */
    failed: number;
}

export interface ChannelContext {
    db: NotifyDb;
    menu: DayData;
    today: string;
}

/**
 * Bir bildirim kanalı. Kanal yalnızca KİME NE gideceğine karar verir; SMTP,
 * rate limit ve dry-run çalıştırıcının işidir. Yeni bir bildirim türü eklemek
 * bu arayüzü uygulayan bir dosya yazıp CHANNELS listesine eklemekten ibaret.
 */
export interface NotificationChannel {
    /** Log ve ileride notification_log için stabil anahtar */
    id: string;
    label: string;
    collect(ctx: ChannelContext): Promise<ChannelResult>;
}
