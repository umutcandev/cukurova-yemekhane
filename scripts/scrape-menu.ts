import { scrapeFullMonth } from '../lib/scraper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log('🚀 Scraping başlatılıyor...\n');

    // Scraping işlemini çalıştır
    const menuData = await scrapeFullMonth();

    // public/data klasörünü oluştur (yoksa)
    const dataDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 public/data klasörü oluşturuldu');
    }

    // Dosya adını al
    const filename = (menuData as any)._filename || `menu-${menuData.month}-${Date.now()}.json`;
    const filePath = path.join(dataDir, filename);

    // JSON'u temizle (_filename'i kaldır)
    const { _filename, ...cleanData } = menuData as any;

    // Dosyaya kaydet
    fs.writeFileSync(filePath, JSON.stringify(cleanData, null, 2), 'utf-8');

    console.log('\n✅ Scraping tamamlandı!');
    console.log(`📄 Dosya: ${filename}`);
    console.log(`📊 Toplam ${menuData.totalDays} gün bulundu`);
    console.log(`📅 Ay: ${menuData.month}`);

    // İstatistikler
    const daysWithData = menuData.days.filter(d => d.hasData).length;
    const totalMeals = menuData.days.reduce((sum, d) => sum + d.meals.length, 0);

    console.log(`\n📈 İstatistikler:`);
    console.log(`   - Veri olan günler: ${daysWithData}`);
    console.log(`   - Toplam yemek sayısı: ${totalMeals}`);
    console.log(`   - Ortalama yemek/gün: ${(totalMeals / daysWithData).toFixed(1)}`);

    // İlk birkaç günü göster (örnek)
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
    // En eski dosyaları temizle (Sadece 5 dosya tut)
    try {
      const dataDir = path.join(__dirname, '..', 'public', 'data');
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir)
          .filter(file => file.endsWith('.json') && file.startsWith('menu-'))
          .map(file => ({
            name: file,
            path: path.join(dataDir, file)
          }))
          .sort((a, b) => b.name.localeCompare(a.name)); // Dosya adına göre yeniden eskiye sırala

        if (files.length > 5) {
          console.log('\n🧹 Eski dosyalar temizleniyor...');
          const filesToDelete = files.slice(5);
          filesToDelete.forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`   🗑️ Silindi: ${file.name}`);
          });
        }
      }
    } catch (cleanupError) {
      console.error('\n⚠️ Dosya temizleme sırasında hata:', cleanupError);
    }
  }
}

main();

