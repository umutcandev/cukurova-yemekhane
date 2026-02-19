import { scrapeFullMonth } from '../lib/scraper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Scraping yapıldıktan sonra finally bloğunda ay klasörünü temizlemek için
  // month bilgisini dışarıda tutuyoruz
  let savedMonth: string | null = null;

  try {
    console.log('🚀 Scraping başlatılıyor...\n');

    const menuData = await scrapeFullMonth();
    savedMonth = menuData.month;

    // Ay klasörünü belirle: public/data/2026-02/
    const dataDir = path.join(__dirname, '..', 'public', 'data');
    const monthDir = path.join(dataDir, menuData.month);

    // Klasörü oluştur (yoksa)
    if (!fs.existsSync(monthDir)) {
      fs.mkdirSync(monthDir, { recursive: true });
      console.log(`📁 Klasör oluşturuldu: public/data/${menuData.month}/`);
    }

    // Yeni dosya adı formatı: menu-YYYYMMDD.json
    const scrapeDateCompact = menuData.scrapeDate.replace(/-/g, '');
    const filename = `menu-${scrapeDateCompact}.json`;
    const filePath = path.join(monthDir, filename);

    // JSON'u temizle (_filename'i kaldır) ve kaydet
    const { _filename, ...cleanData } = menuData as any;
    fs.writeFileSync(filePath, JSON.stringify(cleanData, null, 2), 'utf-8');

    console.log('\n✅ Scraping tamamlandı!');
    console.log(`📄 Dosya: public/data/${menuData.month}/${filename}`);
    console.log(`📊 Toplam ${menuData.totalDays} gün bulundu`);
    console.log(`📅 Ay: ${menuData.month}`);

    const daysWithData = menuData.days.filter(d => d.hasData).length;
    const totalMeals = menuData.days.reduce((sum, d) => sum + d.meals.length, 0);

    console.log(`\n📈 İstatistikler:`);
    console.log(`   - Veri olan günler: ${daysWithData}`);
    console.log(`   - Toplam yemek sayısı: ${totalMeals}`);
    console.log(`   - Ortalama yemek/gün: ${(totalMeals / daysWithData).toFixed(1)}`);

    console.log(`\n📋 İlk 3 gün örneği:`);
    menuData.days.slice(0, 3).forEach(day => {
      if (day.hasData) {
        console.log(`   ${day.date} (${day.dayName}): ${day.meals.length} yemek, ${day.totalCalories} kcal`);
        day.meals.slice(0, 2).forEach(meal => {
          console.log(`      - ${meal.name} (${meal.calories} kcal)`);
        });
      } else {
        console.log(`   ${day.date} (${day.dayName}): Veri yok`);
      }
    });

  } catch (error) {
    console.error('\n❌ Hata oluştu:');
    console.error(error);
    process.exit(1);
  } finally {
    // Sadece bu ayın klasöründeki eski dosyaları temizle (max 5 tut)
    if (savedMonth) {
      try {
        const monthDir = path.join(__dirname, '..', 'public', 'data', savedMonth);

        if (fs.existsSync(monthDir)) {
          const files = fs.readdirSync(monthDir)
            .filter(file => file.endsWith('.json') && file.startsWith('menu-'))
            .map(file => ({
              name: file,
              path: path.join(monthDir, file)
            }))
            .sort((a, b) => b.name.localeCompare(a.name)); // Yeniden eskiye

          if (files.length > 5) {
            console.log('\n🧹 Eski dosyalar temizleniyor...');
            const filesToDelete = files.slice(5);
            filesToDelete.forEach(file => {
              fs.unlinkSync(file.path);
              console.log(`   🗑️ Silindi: ${savedMonth}/${file.name}`);
            });
          }
        }
      } catch (cleanupError) {
        console.error('\n⚠️ Dosya temizleme sırasında hata:', cleanupError);
      }
    }
  }
}

main();
