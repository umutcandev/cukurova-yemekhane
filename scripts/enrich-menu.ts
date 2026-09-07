/**
 * Mevcut public/data JSON dosyalarını yeniden scrape etmeden alerjen
 * bilgisiyle zenginleştirir.
 *
 * Ne zaman çalıştırılır: lib/allergens.ts sözlüğü güncellendiğinde. Sözlüğe
 * yeni bir malzeme eklendiğinde eski veri kendiliğinden düzelmez — bu script
 * tüm veriyi yeniden etiketler.
 *
 *   pnpm enrich
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MenuData, DayMenu } from '../lib/types.js';
import {
  enrichMenuData,
  printEnrichmentReport,
  emitCIAnnotations,
} from '../lib/enrich-menu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dataDir = path.join(__dirname, '..', 'public', 'data');

  if (!fs.existsSync(dataDir)) {
    console.error('❌ public/data bulunamadı. Önce `pnpm scrape` çalıştır.');
    process.exit(1);
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((file) => file.startsWith('menu-') && file.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error('❌ Zenginleştirilecek menü dosyası yok.');
    process.exit(1);
  }

  console.log(`📂 ${files.length} menü dosyası bulundu\n`);

  // Tüm dosyaları belleğe al. Aynı yemek ID'si birden çok dosyada geçtiği için
  // gün listelerini TEK bir sanal MenuData'da topluyoruz: enrichMenuData
  // Meal nesnelerini referansla günceller, böylece her ID sadece bir kez
  // çekilir ama tüm dosyalardaki kopyaları güncellenir.
  const loaded: { file: string; data: MenuData }[] = [];
  const allDays: DayMenu[] = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    try {
      const data: MenuData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      loaded.push({ file, data });
      allDays.push(...data.days);
    } catch (error) {
      console.error(`⚠️  ${file} okunamadı, atlanıyor:`, error);
    }
  }

  if (loaded.length === 0) {
    console.error('❌ Hiçbir dosya okunamadı.');
    process.exit(1);
  }

  const combined: MenuData = {
    month: loaded[loaded.length - 1].data.month,
    lastUpdated: new Date().toISOString(),
    scrapeDate: loaded[loaded.length - 1].data.scrapeDate,
    totalDays: allDays.length,
    days: allDays,
  };

  const report = await enrichMenuData(combined);
  printEnrichmentReport(report);
  emitCIAnnotations(report);

  for (const { file, data } of loaded) {
    fs.writeFileSync(
      path.join(dataDir, file),
      JSON.stringify(data, null, 2),
      'utf-8'
    );
    console.log(`💾 Güncellendi: ${file}`);
  }

  console.log('\n✅ Zenginleştirme tamamlandı.');
}

main().catch((error) => {
  console.error('\n❌ Hata oluştu:');
  console.error(error);
  process.exit(1);
});
