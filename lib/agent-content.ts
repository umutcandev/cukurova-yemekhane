import type { DayMenu } from "./types";
import type { ContentPage } from "./content/types";
import { ALLERGEN_LABELS } from "./allergens";
import { toTitleCase } from "./utils";
import { SITE_URL, SITE_TITLE, UPSTREAM_URL, absoluteUrl } from "./site";

/**
 * Menünün markdown/düz metin sunumu. Hem `Accept: text/markdown` yanıtları hem
 * llms.txt bu dosyadan beslenir; iki çıktı birbirinden ayrışmasın diye tek yer.
 *
 * NOT: Malzeme listesi bilerek dışarıda bırakıldı — reçete ID sabitken
 * değişebildiği için lib/types.ts'te olduğu gibi burada da bayat kopya tutulmaz.
 */

export function formatLongDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Istanbul",
    });
}

/** Alerjen etiketleri: "kesin" / "muhtemel" ayrımı çıktıda korunur. */
function formatAllergens(day: DayMenu): string[] {
    const lines: string[] = [];

    for (const meal of day.meals) {
        if (!meal.allergens?.length) continue;
        const labels = meal.allergens
            .map((hit) => `${ALLERGEN_LABELS[hit.id]}${hit.confidence === "muhtemel" ? " (içerebilir)" : ""}`)
            .join(", ");
        lines.push(`- ${toTitleCase(meal.name)}: ${labels}`);
    }

    return lines;
}

export function formatDayMarkdown(day: DayMenu): string {
    const heading = `## ${formatLongDate(day.date)}`;

    if (!day.hasData || day.meals.length === 0) {
        return `${heading}\n\nBu tarihte menü yok. Tatil günlerinde Üniversite Merkezi Kafeteryası hizmet vermemektedir.`;
    }

    const rows = day.meals
        .map((meal) => `| ${toTitleCase(meal.name)} | ${meal.calories} kcal |`)
        .join("\n");

    const sections = [
        heading,
        "",
        "| Yemek | Kalori |",
        "| --- | --- |",
        rows,
        "",
        `Toplam: ${day.totalCalories} kcal`,
    ];

    const allergens = formatAllergens(day);
    if (allergens.length > 0) {
        sections.push(
            "",
            "### Alerjen uyarıları",
            "",
            ...allergens,
            "",
            "Alerjen listesi malzeme adlarından otomatik çıkarılır ve yalnızca uyarı amaçlıdır;",
            "listede görünmemesi yemeğin o alerjeni içermediği anlamına gelmez.",
        );
    }

    sections.push("", `Detay: ${absoluteUrl(`/?date=${day.date}`)}`);

    return sections.join("\n");
}

export function formatMenuMarkdown(days: DayMenu[], today: string): string {
    const todayMenu = days.find((day) => day.date === today);
    const upcoming = days.filter((day) => day.date > today).slice(0, 7);

    const parts = [
        `# ${SITE_TITLE}`,
        "",
        `Çukurova Üniversitesi Merkezi Kafeterya'nın günlük yemek menüsü. Veriler ${UPSTREAM_URL}`,
        "adresinden düzenli olarak çekilir. Bu site üniversiteden bağımsız, gönüllü bir açık kaynak projesidir.",
        "",
    ];

    if (todayMenu) {
        parts.push("# Bugünün menüsü", "", formatDayMarkdown(todayMenu), "");
    } else {
        parts.push(
            "# Bugünün menüsü",
            "",
            `${formatLongDate(today)} için menü verisi bulunmuyor.`,
            "",
        );
    }

    if (upcoming.length > 0) {
        parts.push("# Sonraki günler", "");
        for (const day of upcoming) {
            parts.push(formatDayMarkdown(day), "");
        }
    }

    parts.push(
        "# Bağlantılar",
        "",
        `- Site: ${SITE_URL}`,
        `- Ajan talimatları: ${absoluteUrl("/llms.txt")}`,
        `- Belirli bir günün menüsü (JSON): ${absoluteUrl("/api/menu/date/YYYY-MM-DD")}`,
    );

    return parts.join("\n");
}

/** Metin sayfalarının markdown sunumu — React sayfasıyla aynı kaynaktan. */
export function formatContentPageMarkdown(page: ContentPage): string {
    const parts = [`# ${page.title}`, "", page.intro, ""];

    for (const section of page.sections) {
        parts.push(`## ${section.heading}`, "");

        for (const paragraph of section.paragraphs ?? []) {
            parts.push(paragraph, "");
        }

        if (section.bullets?.length) {
            parts.push(...section.bullets.map((bullet) => `- ${bullet}`), "");
        }

        if (section.links?.length) {
            parts.push(
                ...section.links.map(
                    (link) =>
                        `- [${link.label}](${link.href.startsWith("http") ? link.href : absoluteUrl(link.href)})`
                ),
                ""
            );
        }
    }

    parts.push(`Kaynak: ${absoluteUrl(page.path)}`);

    return parts.join("\n");
}
