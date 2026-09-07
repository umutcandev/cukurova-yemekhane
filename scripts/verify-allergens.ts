/**
 * Alerjen motorunun kabul kriterleri (ALERJENPLANI 12.1).
 *
 * Repoda test altyapısı yok; bu script onun yerini tutar.
 * Alerjen güvenlik-kritik bir özellik olduğu için lib/allergens.ts'e her
 * dokunuşta çalıştırılmalı:
 *
 *   pnpm verify-allergens
 */
import {
  normalizeIngredient,
  computeMealAllergens,
  filterHitsForUser,
  dietConflict,
  isKnownIngredient,
  INGREDIENT_ALLERGENS,
  INGREDIENT_ALLERGEN_LOOKUP,
  ALLERGEN_ORDER,
  ALLERGEN_LABELS,
  type AllergenId,
  type Confidence,
} from '../lib/allergens.js';

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failures.push(detail ? `${name} — ${detail}` : name);
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function equal(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, a === e ? undefined : `beklenen ${e}, gelen ${a}`);
}

/** Bir yemekteki alerjeni id ile bul */
function hit(names: string[], id: AllergenId) {
  return computeMealAllergens(names).allergens.find((a) => a.id === id);
}

console.log('\n── Normalizasyon ──────────────────────────────────────────');

equal(
  'sondaki nokta silinir',
  normalizeIngredient('BİBER SALÇASI.'),
  'BİBER SALÇASI'
);
equal(
  'çift boşluk tekilleşir + büyük harfe çevrilir',
  normalizeIngredient('patlıcan  (topak)'),
  'PATLICAN (TOPAK)'
);
equal(
  'tr-TR locale: i → İ (düz toUpperCase "IRMIK" yapardı)',
  normalizeIngredient('irmik'),
  'İRMİK'
);
equal(
  'tr-TR locale: I → I, ı → I',
  normalizeIngredient('ışık ı'),
  'IŞIK I'
);
equal(
  'karışık kutu: Kemalpaşa → KEMALPAŞA',
  normalizeIngredient('Kemalpaşa'),
  'KEMALPAŞA'
);
equal(
  '&nbsp; normal boşluğa iner',
  normalizeIngredient('KURU SOĞAN'),
  'KURU SOĞAN'
);
equal('baştaki/sondaki boşluk', normalizeIngredient('  TUZ  '), 'TUZ');

console.log('\n── Sözlük bütünlüğü ───────────────────────────────────────');

// Bu, R1'in en olası tetikleyicisi: ham anahtar ile arama anahtarı uyuşmazsa
// eşleşme sessizce başarısız olur ve alerjen "yok" gibi görünür.
const rawKeys = Object.keys(INGREDIENT_ALLERGENS);
const notNormalized = rawKeys.filter(
  (k) => !INGREDIENT_ALLERGEN_LOOKUP.has(normalizeIngredient(k))
);
check(
  'her ham anahtar normalize edilmiş sözlükte bulunuyor',
  notNormalized.length === 0,
  notNormalized.join(', ')
);

const dupes = rawKeys.length - INGREDIENT_ALLERGEN_LOOKUP.size;
check(
  'normalize sonrası çakışan anahtar yok',
  dupes === 0,
  `${dupes} anahtar birleşti`
);

const badAllergenIds: string[] = [];
for (const [key, map] of Object.entries(INGREDIENT_ALLERGENS)) {
  for (const [id, conf] of Object.entries(map)) {
    if (!ALLERGEN_ORDER.includes(id as AllergenId)) {
      badAllergenIds.push(`${key}: ${id}`);
    }
    if (conf !== 'kesin' && conf !== 'muhtemel') {
      badAllergenIds.push(`${key}: ${id}=${conf}`);
    }
  }
}
check(
  'tüm alerjen id ve güven değerleri geçerli',
  badAllergenIds.length === 0,
  badAllergenIds.join(', ')
);

check(
  'her alerjen için etiket tanımlı',
  ALLERGEN_ORDER.every((id) => Boolean(ALLERGEN_LABELS[id])),
  'eksik etiket var'
);

console.log(`  ℹ️  sözlük boyutu: ${INGREDIENT_ALLERGEN_LOOKUP.size} malzeme`);

console.log('\n── Alerjen toplama ────────────────────────────────────────');

// "kesin" her zaman "muhtemel"i ezer: SÜT kesin süt, BİTKİSEL MARGARİN
// muhtemel süt → sonuç kesin olmalı.
const merged = hit(['UN', 'SÜT', 'BİTKİSEL MARGARİN'], 'sut');
equal('kesin, muhtemel’i ezer (sut)', merged?.confidence, 'kesin');
check(
  '"from" her iki kaynağı da listeler',
  merged?.from.includes('SÜT') === true &&
    merged?.from.includes('BİTKİSEL MARGARİN') === true,
  JSON.stringify(merged?.from)
);

// Ters sıra da aynı sonucu vermeli (sıra bağımlılığı olmamalı)
equal(
  'sıra bağımsız: muhtemel önce gelse de sonuç kesin',
  hit(['BİTKİSEL MARGARİN', 'SÜT'], 'sut')?.confidence,
  'kesin'
);

equal('gluten kesin (UN)', hit(['UN', 'SÜT'], 'gluten')?.confidence, 'kesin');
equal(
  'soya muhtemel kalır (margarin)',
  hit(['BİTKİSEL MARGARİN'], 'soya')?.confidence,
  'muhtemel'
);

const clean = computeMealAllergens(['DOMATES', 'SALATALIK', 'TUZ']);
equal('alerjensiz yemek boş dizi döner', clean.allergens, []);
equal('alerjensiz yemekte unmapped boş', clean.unmapped, []);

console.log('\n── Bilinmeyen malzeme (6.3 — sessiz başarısızlık sigortası) ─');

const unknown = computeMealAllergens(['UN', 'TAHİN', 'ZZZ YENİ MALZEME']);
equal('bilinmeyenler unmapped’e düşer', unknown.unmapped, [
  'TAHİN',
  'ZZZ YENİ MALZEME',
]);
equal(
  'bilinmeyen, bilinen alerjeni etkilemez',
  unknown.allergens.map((a) => a.id),
  ['gluten']
);
check(
  'boş sözlük girdisi "bilinmiyor" DEĞİLDİR',
  isKnownIngredient('DOMATES') && !isKnownIngredient('TAHİN'),
  'DOMATES bilinmeli, TAHİN bilinmemeli'
);
equal(
  'aynı bilinmeyen iki kez sayılmaz',
  computeMealAllergens(['TAHİN', 'tahin']).unmapped,
  ['TAHİN']
);

console.log('\n── Diyet işaretleri ───────────────────────────────────────');

const kofte = computeMealAllergens(['DANA ETİ', 'SÜT', 'UN']);
equal('etli yemek hasMeat', kofte.dietFlags.hasMeat, true);
equal('etli yemek hasAnimalProduct', kofte.dietFlags.hasAnimalProduct, true);

const vejetaryen = computeMealAllergens(['YOĞURT', 'PATATES']);
equal('yoğurtlu yemek hasMeat=false', vejetaryen.dietFlags.hasMeat, false);
equal(
  'yoğurtlu yemek hasAnimalProduct=true',
  vejetaryen.dietFlags.hasAnimalProduct,
  true
);

const vegan = computeMealAllergens(['PATATES', 'ZEYTİNYAĞI', 'TUZ']);
equal('vegan yemek hasAnimalProduct=false', vegan.dietFlags.hasAnimalProduct, false);

console.log('\n── Kullanıcı süzgeci (filterHitsForUser) ──────────────────');

const hits = computeMealAllergens(['UN', 'SÜT', 'BİTKİSEL MARGARİN']).allergens;

equal(
  'seçim yoksa hiçbir uyarı üretilmez',
  filterHitsForUser(hits, [], true),
  []
);
equal(
  'yalnızca seçilen alerjen döner',
  filterHitsForUser(hits, ['gluten'], true).map((h) => h.id),
  ['gluten']
);
equal(
  'includeProbable=false → muhtemel elenir (soya)',
  filterHitsForUser(hits, ['soya'], false),
  []
);
equal(
  'includeProbable=true → muhtemel kalır (soya)',
  filterHitsForUser(hits, ['soya'], true).map((h) => h.id),
  ['soya']
);
equal(
  'includeProbable=false kesin eşleşmeyi elemez (sut)',
  filterHitsForUser(hits, ['sut'], false).map((h) => h.id),
  ['sut']
);

console.log('\n── Beslenme tercihi (dietConflict) ────────────────────────');

const etli = computeMealAllergens(['DANA ETİ', 'PATATES']).dietFlags;
const sutlu = computeMealAllergens(['YOĞURT', 'PATATES']).dietFlags;
const bitkisel = computeMealAllergens(['PATATES', 'ZEYTİNYAĞI']).dietFlags;

equal('tercih yoksa uyarı yok', dietConflict(etli, 'none'), null);
equal('vejetaryen + etli → meat', dietConflict(etli, 'vegetarian'), 'meat');
equal('vejetaryen + sütlü → uyarı yok', dietConflict(sutlu, 'vegetarian'), null);
equal('vegan + sütlü → animal', dietConflict(sutlu, 'vegan'), 'animal');
equal('vegan + etli → meat', dietConflict(etli, 'vegan'), 'meat');
equal('vegan + bitkisel → uyarı yok', dietConflict(bitkisel, 'vegan'), null);
equal('dietFlags yoksa uyarı yok', dietConflict(undefined, 'vegan'), null);

console.log('\n── Gerçek yemek: id=97 Hasan Paşa Köfte (12.2) ────────────');

// ALERJENPLANI 3.2'deki gerçek reçete
const hasanPasa = computeMealAllergens([
  'DANA ETİ',
  'EKMEK SOMUN',
  'KURU SOĞAN',
  'KAŞAR PEYNİRİ',
  'YUMURTA',
  'MAYDANOZ',
  'DOMATES SALÇASI',
  'BİBER SALÇASI.',
  'KARABİBER',
  'TOZ BİBER',
  'KİMYON',
  'UN',
  'PATATES',
  'SÜT',
  'AYÇİÇEK YAĞI',
  'BİTKİSEL MARGARİN',
  'TUZ',
]);

const asMap: Partial<Record<AllergenId, Confidence>> = {};
for (const a of hasanPasa.allergens) asMap[a.id] = a.confidence;

equal('gluten kesin', asMap.gluten, 'kesin');
equal('süt kesin', asMap.sut, 'kesin');
equal('yumurta kesin', asMap.yumurta, 'kesin');
equal('soya muhtemel', asMap.soya, 'muhtemel');
equal('bilinmeyen malzeme yok', hasanPasa.unmapped, []);
equal('hasMeat', hasanPasa.dietFlags.hasMeat, true);

console.log('\n───────────────────────────────────────────────────────────');
if (failures.length === 0) {
  console.log(`✅ ${passed} kontrol geçti.\n`);
} else {
  console.log(`❌ ${failures.length} kontrol BAŞARISIZ (${passed} geçti):\n`);
  failures.forEach((f) => console.log(`   - ${f}`));
  console.log('');
  process.exit(1);
}
