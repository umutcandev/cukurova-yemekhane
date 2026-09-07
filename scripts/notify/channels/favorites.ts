import { and, eq, isNotNull } from "drizzle-orm";
import * as schema from "../../../lib/db/schema.js";
import { LOW_CALORIE_THRESHOLD } from "../../../lib/constants.js";
import { SITE_URL } from "../env.js";
import { emailShell, safeTitle, maskEmail } from "../format.js";
import type {
    ChannelContext,
    ChannelResult,
    MealData,
    NotificationChannel,
    OutgoingEmail,
} from "../types.js";

/** Dışa açık, çünkü şablonu göndermeden önce render edip gözden geçirebilmek gerekir. */
export function buildFavoritesEmail(
    userName: string,
    meals: MealData[],
    today: string
): string {
    const mealList = meals
        .map(
            (m) =>
                `<li style="padding: 4px 0;">${safeTitle(m.name)} <span style="color: #888;">(${m.calories} kcal)</span></li>`
        )
        .join("");

    return emailShell({
        heading:
            "Favori yemeğiniz bugün Çukurova Üniversitesi Yemekhane menüsünde!",
        date: today,
        userName,
        intro: "Bugünkü menüde favorilediğiniz yemekler var:",
        body: `
        <ul style="list-style: disc; padding-left: 20px; margin: 16px 0; font-size: 14px;">
            ${mealList}
        </ul>`,
        footer: `
        <p style="color: #999; font-size: 11px;">
            Bu e-postayı <a href="${SITE_URL}" style="color: #999;">cukurova.app</a> üzerinden favori bildirimlerini
            açtığınız için alıyorsunuz. Bildirimleri kapatmak için
            <a href="${SITE_URL}/favorilerim" style="color: #999;">Favorilerim</a> sayfasını ziyaret edin.
        </p>`,
    });
}

export const favoritesChannel: NotificationChannel = {
    id: "favorites",
    label: "Favori bildirimleri",

    async collect({ db, menu, today }: ChannelContext): Promise<ChannelResult> {
        const emails: OutgoingEmail[] = [];
        let skipped = 0;
        let failed = 0;

        const todayMealIds = menu.meals.map((m) => m.id);

        const subscribedUsers = await db
            .select({
                userId: schema.emailPreferences.userId,
                excludeLowCalorie: schema.emailPreferences.excludeLowCalorie,
            })
            .from(schema.emailPreferences)
            .where(eq(schema.emailPreferences.notifyFavorites, true));

        if (subscribedUsers.length === 0) {
            console.log("ℹ️ Bildirim almak isteyen kullanıcı yok.");
            return { emails, skipped, failed };
        }

        console.log(`👥 ${subscribedUsers.length} kullanıcı bildirim almak istiyor.\n`);

        for (const sub of subscribedUsers) {
            try {
                const userResult = await db
                    .select({ name: schema.users.name, email: schema.users.email })
                    .from(schema.users)
                    .where(eq(schema.users.id, sub.userId));

                if (userResult.length === 0 || !userResult[0].email) {
                    console.log(
                        `   ⚠️ Kullanıcı bulunamadı veya e-posta yok: ${sub.userId.substring(0, 6)}***`
                    );
                    skipped++;
                    continue;
                }

                const user = userResult[0];

                // Kullanıcının favorilerini çek (meal_id'si olanlar)
                const userFavorites = await db
                    .select({ mealId: schema.favorites.mealId })
                    .from(schema.favorites)
                    .where(
                        and(
                            eq(schema.favorites.userId, sub.userId),
                            isNotNull(schema.favorites.mealId)
                        )
                    );

                if (userFavorites.length === 0) {
                    skipped++;
                    continue;
                }

                const matchedFavIds = userFavorites
                    .filter((f) => f.mealId && todayMealIds.includes(f.mealId))
                    .map((f) => f.mealId!);

                if (matchedFavIds.length === 0) {
                    skipped++;
                    continue;
                }

                let matchedMeals = menu.meals.filter((m) =>
                    matchedFavIds.includes(m.id)
                );

                // Düşük kalori filtresi
                if (sub.excludeLowCalorie) {
                    const before = matchedMeals.length;
                    matchedMeals = matchedMeals.filter(
                        (m) => m.calories >= LOW_CALORIE_THRESHOLD
                    );
                    if (matchedMeals.length === 0) {
                        console.log(
                            `   ⏭️  ${maskEmail(user.email!)} — tüm eşleşmeler ${LOW_CALORIE_THRESHOLD} kcal altı, atlandı`
                        );
                        skipped++;
                        continue;
                    }
                    if (matchedMeals.length < before) {
                        console.log(
                            `   ℹ️  ${maskEmail(user.email!)} — ${before - matchedMeals.length} düşük kalorili yemek elendi`
                        );
                    }
                }

                emails.push({
                    userId: sub.userId,
                    to: user.email!,
                    subject: "Favori yemeğiniz bugün yemekhane menüsünde!",
                    html: buildFavoritesEmail(
                        user.name || "Kullanıcı",
                        matchedMeals,
                        today
                    ),
                    summary: matchedMeals.map((m) => m.name).join(", "),
                });
            } catch (err) {
                console.error(`   ❌ Hata (${sub.userId.substring(0, 6)}***):`, err);
                failed++;
            }
        }

        return { emails, skipped, failed };
    },
};
