import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import type { Ingredient, MealDetail } from './types';

/**
 * yemek-goster.asp detay sayfası için TEK parse noktası.
 *
 * Hem runtime API (app/api/meal/[id]/route.ts) hem build-time zenginleştirme
 * (lib/enrich-menu.ts) buradan geçer. İki ayrı parser tutmak, alerjen
 * etiketiyle kullanıcıya gösterilen malzeme listesinin sessizce
 * ayrışmasına yol açardı.
 */

const MEAL_DETAIL_URL = 'https://yemekhane.cu.edu.tr/yemek-goster.asp';

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * Detay sayfasının HTML'ini çeker.
 * Site Windows-1254 yayınlıyor; Türkçe karakterler için iconv şart.
 */
export async function fetchMealDetailHtml(
    id: string,
    init?: { signal?: AbortSignal }
): Promise<string> {
    const response = await fetch(`${MEAL_DETAIL_URL}?id=${id}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: init?.signal,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch meal detail: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return iconv.decode(Buffer.from(buffer), 'windows-1254');
}

/**
 * Malzeme satırını ayrıştırır: "DANA ETİ 110 GR", "EKMEK SOMUN 0,166 ADET".
 * Miktar Türkçe ondalık ayracı kullanır (0,166).
 */
function parseIngredientRow(cellText: string): Ingredient | null {
    const match = cellText.match(/^(.+?)\s+([\d,\.]+)\s+(.+)$/);
    if (!match) return null;

    const [, name, amountStr, unit] = match;
    return {
        name: name.trim(),
        amount: parseFloat(amountStr.replace(',', '.')),
        unit: unit.trim(),
    };
}

/** HTML'den kalori, görsel ve malzeme listesini çıkarır. */
export function parseMealDetail(html: string, id: string): MealDetail {
    const $ = cheerio.load(html);

    // Kalori kırmızı font içinde
    let calories = 0;
    $('font[color="red"]').each((_, el) => {
        const match = $(el).text().trim().match(/(\d+)/);
        if (match) {
            calories = parseInt(match[1]);
        }
    });

    let imageUrl: string | null = null;
    const imgSrc = $('img[src^="yemekler/"]').attr('src');
    if (imgSrc) {
        imageUrl = `https://yemekhane.cu.edu.tr/${imgSrc}`;
    }

    const ingredients: Ingredient[] = [];
    $('table tr').each((_, row) => {
        const cellText = $(row).find('td').first().text().trim();
        if (!cellText) return;

        const ingredient = parseIngredientRow(cellText);
        if (ingredient) {
            ingredients.push(ingredient);
        }
    });

    return {
        id,
        name: `Yemek #${id}`,
        calories,
        imageUrl,
        ingredients,
    };
}

/** Çek + parse. */
export async function fetchMealDetail(
    id: string,
    init?: { signal?: AbortSignal }
): Promise<MealDetail> {
    const html = await fetchMealDetailHtml(id, init);
    return parseMealDetail(html, id);
}
