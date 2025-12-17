import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import type { MenuData, DayMenu, Meal } from './types.js';

export async function scrapeFullMonth(): Promise<MenuData> {
  console.log('📡 Yemekhane sitesinden veri çekiliyor...');

  // 1. Sayfayı çek (Windows-1254 encoding için iconv kullan)
  const response = await fetch('https://yemekhane.cu.edu.tr/default.asp');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const html = iconv.decode(Buffer.from(buffer), 'windows-1254');

  console.log('✅ Sayfa başarıyla çekildi, parse ediliyor...');

  // 2. Cheerio ile parse et
  const $ = cheerio.load(html);

  // 3. Tüm gün kartlarını bul (col-md-2 ve col-md-3)
  const dayCards = $('.col-md-2, .col-md-3');
  const days: DayMenu[] = [];

  console.log(`📅 ${dayCards.length} gün kartı bulundu`);

  dayCards.each((index, element) => {
    const $card = $(element);

    // 4. Veri kontrolü (atlanan günler için)
    const cardText = $card.text();
    const hasData = !cardText.includes('Yemekhane yemek bilgileri girilmemiştir');

    // 5. Tarih ve YMK parse et
    const dateLink = $card.find('FONT[size="6"] a').attr('href');
    const ymkMatch = dateLink?.match(/ymk=(\d+)/);
    const ymk = ymkMatch ? parseInt(ymkMatch[1]) : null;

    // Tarih metnini al (FONT içinden, <br> tag'lerini boşlukla değiştirerek)
    const $font = $card.find('FONT[size="6"]');
    $font.find('br').replaceWith(' ');
    let dateText = $font.text().replace(/\s+/g, ' ').trim();
    // Örnek: "03.11.2025 Pazartesi" veya sadece "03.11.2025"
    const dateMatch = dateText.match(/(\d{2})\.(\d{2})\.(\d{4})/);

    if (!dateMatch || !ymk) {
      console.warn(`⚠️  Geçersiz kart atlandı (index: ${index})`);
      return; // Geçersiz kart, skip et
    }

    const [, day, month, year] = dateMatch;
    const date = `${year}-${month}-${day}`; // ISO format: "2025-11-03"

    // Gün adını bul (tarihten sonraki kelime veya FONT[size="5"] içinden)
    let dayName = dateText.split(/\s+/)[1] || '';
    if (!dayName) {
      dayName = $card.find('FONT[size="5"]').text().split(',')[0].trim() || '';
    }

    // 6. Yemekleri parse et (sadece hasData=true ise)
    const meals: Meal[] = [];
    let totalCalories = 0;

    if (hasData) {
      $card.find('ul li a').each((i, el) => {
        const $link = $(el);
        const href = $link.attr('href') || '';

        // Yemek ID'sini çıkar: yemek-goster.asp?id=157 → 157
        const idMatch = href.match(/id=(\d+)/);
        if (!idMatch) return;

        const id = idMatch[1];

        // Link text'ini al ve <br> ile ayır
        const linkHtml = $link.html() || '';
        const parts = linkHtml.split('<br>');
        const name = parts[0]?.trim() || '';

        // Kaloriyi parse et: "294 Kalori" → 294
        const caloriesText = parts[1] || '';
        const caloriesMatch = caloriesText.match(/(\d+)/);
        const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 0;

        meals.push({ id, name, calories, category: 'ana_yemek' }); // category sonra belirlenebilir
      });

      // 7. Toplam kaloriyi parse et
      const calorieSpans = $card.find('span[style*="color: rgb(204, 0, 0)"]');
      calorieSpans.each((i, el) => {
        const text = $(el).text();
        // "Toplam 797 Kalori" veya "Ana Yemekli : 891 Kalori"
        const match = text.match(/(\d+)/);
        if (match) {
          const cal = parseInt(match[1]);
          // "Ana Yemekli" varsa onu kullan, yoksa "Toplam" değerini kullan
          if (text.includes('Ana Yemekli') || i === 0) {
            totalCalories = cal;
          }
        }
      });
    }

    days.push({
      ymk: ymk!,
      date,
      dayName,
      hasData,
      meals,
      totalCalories,
    });
  });

  // Ay bilgisini ilk günden al
  const firstDay = days[0];
  const monthMatch = firstDay?.date.match(/(\d{4})-(\d{2})/);
  const month = monthMatch ? `${monthMatch[1]}-${monthMatch[2]}` : '';

  // Bugünün tarihini al (scrape tarihi için)
  const today = new Date();
  const scrapeDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const scrapeDateFilename = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  // 8. JSON'a kaydet
  const menuData: MenuData = {
    month,
    lastUpdated: new Date().toISOString(),
    scrapeDate,
    totalDays: days.length,
    days: days.sort((a, b) => a.ymk - b.ymk), // YMK'ye göre sırala
  };

  return { ...menuData, _filename: `menu-${month}-${scrapeDateFilename}.json` } as MenuData & { _filename: string };
}

