import { and, eq } from "drizzle-orm";
import * as schema from "../../lib/db/schema.js";
import type { NotifyDb } from "./types.js";

/**
 * Bu kanaldan bu menü günü için MAİL GİTMİŞ kullanıcıların id'leri.
 *
 * Koşu başına tek sorgu: kullanıcı başına kontrol etmek 18 satır için de
 * gereksiz, listeler büyüdüğünde ise N+1.
 */
export async function loadAlreadySent(
    db: NotifyDb,
    channel: string,
    menuDate: string
): Promise<ReadonlySet<string>> {
    const rows = await db
        .select({ userId: schema.notificationLog.userId })
        .from(schema.notificationLog)
        .where(
            and(
                eq(schema.notificationLog.channel, channel),
                eq(schema.notificationLog.menuDate, menuDate)
            )
        );

    return new Set(rows.map((r) => r.userId));
}

/**
 * Gönderimi kaydeder. YALNIZCA sendMail başarılı döndükten sonra çağrılır.
 *
 * onConflictDoNothing: aynı anda iki koşu varsa (çift tetiklenen cron) ikinci
 * insert sessizce düşsün, unique ihlali koşuyu düşürmesin.
 */
export async function recordSent(
    db: NotifyDb,
    channel: string,
    menuDate: string,
    userId: string
): Promise<void> {
    await db
        .insert(schema.notificationLog)
        .values({ userId, channel, menuDate })
        .onConflictDoNothing();
}
