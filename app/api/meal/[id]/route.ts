import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export const revalidate = 86400; // Cache for 1 day

interface MealDetailResponse {
    id: string;
    name: string;
    calories: number;
    imageUrl: string | null;
    ingredients: {
        name: string;
        amount: number;
        unit: string;
    }[];
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch the meal detail page
        const url = `https://yemekhane.cu.edu.tr/yemek-goster.asp?id=${id}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch meal detail: ${response.status}`);
        }

        // Decode the response (Windows-1254 encoding for Turkish characters)
        const buffer = await response.arrayBuffer();
        const html = iconv.decode(Buffer.from(buffer), 'windows-1254');

        // Parse with Cheerio
        const $ = cheerio.load(html);

        // Extract calories (red font color)
        let calories = 0;
        $('font[color="red"]').each((_, el) => {
            const text = $(el).text().trim();
            const match = text.match(/(\d+)/);
            if (match) {
                calories = parseInt(match[1]);
            }
        });

        // Extract image URL
        let imageUrl: string | null = null;
        const imgSrc = $('img[src^="yemekler/"]').attr('src');
        if (imgSrc) {
            imageUrl = `https://yemekhane.cu.edu.tr/${imgSrc}`;
        }

        // Extract ingredients from table
        const ingredients: { name: string; amount: number; unit: string }[] = [];
        $('table tr').each((_, row) => {
            const $row = $(row);
            const cellText = $row.find('td').first().text().trim();

            if (cellText) {
                // Parse format: "DANA ETİ 150 GR" or "SARIMSAK 0,2 GR"
                const match = cellText.match(/^(.+?)\s+([\d,\.]+)\s+(.+)$/);
                if (match) {
                    const [, name, amountStr, unit] = match;
                    // Convert Turkish decimal separator (,) to dot (.)
                    const amount = parseFloat(amountStr.replace(',', '.'));

                    ingredients.push({
                        name: name.trim(),
                        amount,
                        unit: unit.trim(),
                    });
                }
            }
        });

        // Get meal name from the first ingredient or use a default
        const mealName = `Yemek #${id}`;

        const mealDetail: MealDetailResponse = {
            id,
            name: mealName,
            calories,
            imageUrl,
            ingredients,
        };

        return NextResponse.json(mealDetail);
    } catch (error) {
        console.error('Error scraping meal detail:', error);
        return NextResponse.json(
            { error: 'Failed to fetch meal detail' },
            { status: 500 }
        );
    }
}
