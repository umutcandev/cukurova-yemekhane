/**
 * Alerjen uyarısı — favori bildiriminden AYRI bir mail.
 *
 * Neden ayrı mail: favori maili "yaşasın, sevdiğin yemek var" tonunda;
 * alerjen maili "dikkat" tonunda. İkisini tek mailde birleştirmek her
 * ikisinin de etkisini öldürür ve uyarının atlanmasına yol açar.
 *
 * ÜRÜN SÖZLEŞMESİ: eşleşme yoksa mail ATILMAZ. "Bugün senin için temiz"
 * maili yok — sistem güvenli olduğunu asla söylemez.
 */

import { eq } from "drizzle-orm";
import * as schema from "../../../lib/db/schema.js";
import {
    ALLERGEN_LABELS,
    CONFIDENCE_LABELS,
    DIET_CONFLICT_LABELS,
    dietConflict,
    filterHitsForUser,
    type AllergenHit,
    type AllergenId,
    type DietPreference,
} from "../../../lib/allergens.js";
import { SITE_URL } from "../env.js";
import { emailShell, safeTitle } from "../format.js";
import type {
    ChannelContext,
    ChannelResult,
    MealData,
    NotificationChannel,
    OutgoingEmail,
} from "../types.js";

interface AllergenMatch {
    meal: MealData;
    hits: AllergenHit[];
}

/** Dışa açık, çünkü şablonu göndermeden önce render edip gözden geçirebilmek gerekir. */
export function buildAllergenEmail(
    userName: string,
    matches: AllergenMatch[],
    unclassified: MealData[],
    dietMeals: { meal: MealData; label: string }[],
    today: string
): string {
    const matchList = matches
        .map(({ meal, hits }) => {
            const badges = hits
                .map(
                    (h) =>
                        `<strong>${ALLERGEN_LABELS[h.id]}</strong> (${CONFIDENCE_LABELS[h.confidence]})`
                )
                .join(", ");
            const reasons = hits
                .map((h) => h.from.map(safeTitle).join(", "))
                .join(" · ");
            return `
            <li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="font-size: 14px; color: #1a1a1a;">${safeTitle(meal.name)}</div>
                <div style="font-size: 13px; color: #b91c1c; margin-top: 2px;">${badges}</div>
                <div style="font-size: 12px; color: #888; margin-top: 2px;">Tetikleyen malzeme: ${reasons}</div>
            </li>`;
        })
        .join("");

    const unclassifiedBlock =
        unclassified.length === 0
            ? ""
            : `
        <p style="color: #92400e; font-size: 13px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px;">
            Şu yemeklerin bazı malzemeleri sınıflandırılamadı, alerjen listesi eksik olabilir:
            <strong>${unclassified.map((m) => safeTitle(m.name)).join(", ")}</strong>
        </p>`;

    const dietBlock =
        dietMeals.length === 0
            ? ""
            : `
        <p style="color: #9a3412; font-size: 13px; margin-top: 16px;">
            Beslenme tercihinizle uyuşmayanlar:
            ${dietMeals.map((d) => `<strong>${safeTitle(d.meal.name)}</strong> (${d.label})`).join(", ")}
        </p>`;

    return emailShell({
        heading: "Bugünkü menüde dikkat etmeniz gereken bir yemek var",
        date: today,
        userName,
        intro:
            "Bugünkü menüde, uyarı almak istediğiniz alerjenlerden içeren yemekler var:",
        body: `
        <ul style="list-style: none; padding: 0; margin: 16px 0;">
            ${matchList}
        </ul>

        ${unclassifiedBlock}
        ${dietBlock}`,
        footer: `
        <p style="color: #999; font-size: 11px;">
            Bu bilgi yemekhanenin yayınladığı reçeteden otomatik olarak
            türetilmiştir; resmî bir gıda etiketi değildir. Hazır ürünlerin içeriği ve mutfaktaki çapraz bulaşma bu listeye dahil değildir.
            Ciddi bir gıda alerjiniz varsa yemeği tüketmeden önce mutlaka yemekhane
            yetkililerine danışın. Kaynak:
            <a href="https://yemekhane.cu.edu.tr" style="color: #999;">yemekhane.cu.edu.tr</a>
        </p>

        <p style="color: #999; font-size: 11px;">
            Bu e-postayı <a href="${SITE_URL}" style="color: #999;">cukurova.app</a> üzerinden alerjen
            bildirimlerini açtığınız için alıyorsunuz. Kapatmak için
            <a href="${SITE_URL}/ayarlar" style="color: #999;">Ayarlar</a> sayfasını ziyaret edin.
        </p>`,
    });
}

export const allergensChannel: NotificationChannel = {
    id: "allergens",
    label: "Alerjen bildirimleri",

    async collect({ db, menu, today }: ChannelContext): Promise<ChannelResult> {
        const emails: OutgoingEmail[] = [];
        let skipped = 0;
        let failed = 0;

        const subscribers = await db
            .select({
                userId: schema.allergenPreferences.userId,
                includeProbable: schema.allergenPreferences.includeProbable,
                dietPreference: schema.allergenPreferences.dietPreference,
            })
            .from(schema.allergenPreferences)
            .where(eq(schema.allergenPreferences.notifyAllergens, true));

        if (subscribers.length === 0) {
            console.log("ℹ️ Alerjen bildirimi isteyen kullanıcı yok.");
            return { emails, skipped, failed };
        }

        console.log(`👥 ${subscribers.length} kullanıcı alerjen bildirimi istiyor.\n`);

        for (const sub of subscribers) {
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

                const selectedRows = await db
                    .select({ allergenId: schema.userAllergens.allergenId })
                    .from(schema.userAllergens)
                    .where(eq(schema.userAllergens.userId, sub.userId));

                const selected = selectedRows.map((r) => r.allergenId as AllergenId);

                const matches: AllergenMatch[] = [];
                const unclassified: MealData[] = [];
                const dietMeals: { meal: MealData; label: string }[] = [];

                for (const meal of menu.meals) {
                    const hits = filterHitsForUser(
                        meal.allergens ?? [],
                        selected,
                        sub.includeProbable
                    );
                    if (hits.length > 0) {
                        matches.push({ meal, hits });
                    } else if (
                        selected.length > 0 &&
                        (meal.unmappedIngredients?.length ?? 0) > 0
                    ) {
                        // Eşleşme yok AMA sınıflandırılamayan malzeme var:
                        // "temiz" diye geçiştirilemez.
                        unclassified.push(meal);
                    }

                    const conflict = dietConflict(
                        meal.dietFlags,
                        sub.dietPreference as DietPreference
                    );
                    if (conflict) {
                        dietMeals.push({ meal, label: DIET_CONFLICT_LABELS[conflict] });
                    }
                }

                // Eşleşme yoksa mail YOK. Beslenme uyuşmazlığı tek başına mail
                // sebebi değil — her gün ette et var, bu gürültü olurdu.
                if (matches.length === 0) {
                    skipped++;
                    continue;
                }

                emails.push({
                    userId: sub.userId,
                    to: user.email!,
                    subject: "Bugünkü menüde dikkat etmeniz gereken bir yemek var",
                    html: buildAllergenEmail(
                        user.name || "Kullanıcı",
                        matches,
                        unclassified,
                        dietMeals,
                        today
                    ),
                    summary: matches
                        .map(
                            (m) =>
                                `${m.meal.name} (${m.hits.map((h) => ALLERGEN_LABELS[h.id]).join("/")})`
                        )
                        .join(", "),
                });
            } catch (err) {
                console.error(`   ❌ Hata (${sub.userId.substring(0, 6)}***):`, err);
                failed++;
            }
        }

        return { emails, skipped, failed };
    },
};
