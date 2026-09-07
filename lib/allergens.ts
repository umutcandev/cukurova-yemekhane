/**
 * Alerjen etiketleme motoru.
 *
 * ÜRÜN SÖZLEŞMESİ — bu dosyayı değiştirirken ihlal etme:
 * Sistem asla "bu yemek senin için güvenli" demez. Yalnızca tek yönlü bir uyarı
 * motorudur: "bunda X var / olabilir" der, "bunda X yok" demez. Bu yüzden
 * Confidence tipinde bilinçli olarak "yok" değeri yoktur.
 *
 * Veri kaynağı yemekhanenin yayınladığı MUTFAK REÇETESİDİR, gıda etiketi değil.
 * Bileşik/hazır ürünler (puding, margarin, bulyon, pane...) alt malzemelerine
 * ayrılmıyor; bu yüzden "muhtemel" seviyesi zorunlu. Şüphede kalınan her
 * malzemede "muhtemel" seçilir — yanlış pozitif kullanıcıyı rahatsız eder,
 * yanlış negatif hastaneye gönderir.
 */

/** Türk Gıda Kodeksi / EU 14 alerjen listesi */
export type AllergenId =
  | "gluten" // Gluten içeren tahıllar
  | "sut" // Süt ve süt ürünleri (laktoz dahil)
  | "yumurta"
  | "susam"
  | "sert_kabuklu" // Ceviz, fındık, badem, antep fıstığı, çam fıstığı...
  | "yerfistigi"
  | "soya"
  | "balik"
  | "kabuklu_deniz" // Kabuklu deniz hayvanları (crustacea)
  | "yumusakca" // Yumuşakçalar (mollusca)
  | "sulfit" // SO2 / sülfitler (>10 mg/kg)
  | "hardal"
  | "kereviz"
  | "lupen";

/**
 * "kesin"    → malzeme adı alerjeni doğrudan içeriyor
 * "muhtemel" → bileşik/hazır ürün; içerebilir ama reçeteden görünmüyor
 * NOT: bilinçli olarak "yok" değeri YOKTUR.
 */
export type Confidence = "kesin" | "muhtemel";

export type AllergenMap = Partial<Record<AllergenId, Confidence>>;

export interface AllergenHit {
  id: AllergenId;
  confidence: Confidence;
  /** Bu alerjeni tetikleyen malzeme adları — UI'da "neden" göstermek için */
  from: string[];
}

export const ALLERGEN_LABELS: Record<AllergenId, string> = {
  gluten: "Gluten",
  sut: "Süt",
  yumurta: "Yumurta",
  susam: "Susam",
  sert_kabuklu: "Sert Kabuklu Yemiş",
  yerfistigi: "Yer Fıstığı",
  soya: "Soya",
  balik: "Balık",
  kabuklu_deniz: "Kabuklu Deniz Ürünü",
  yumusakca: "Yumuşakça",
  sulfit: "Sülfit",
  hardal: "Hardal",
  kereviz: "Kereviz",
  lupen: "Lüpen",
};

/** UI'da sabit sıra — Object.keys sırasına güvenme */
export const ALLERGEN_ORDER: AllergenId[] = [
  "gluten",
  "sut",
  "yumurta",
  "susam",
  "sert_kabuklu",
  "yerfistigi",
  "soya",
  "balik",
  "kabuklu_deniz",
  "yumusakca",
  "sulfit",
  "hardal",
  "kereviz",
  "lupen",
];

/**
 * Kullanıcıya gösterilen güven ifadesi. "muhtemel" hiçbir zaman "muhtemel"
 * diye gösterilmez — "içerebilir" daha anlaşılır ve daha uyarıcı.
 */
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  kesin: "kesin",
  muhtemel: "içerebilir",
};

/**
 * Malzeme → alerjen sözlüğü.
 *
 * `{}` = "bakıldı, alerjen tespit edilmedi".
 * Sözlükte BULUNMAYAN token ise "bilinmiyor" demektir ve yemeği "eksik veri"
 * durumuna düşürür. Bu ikisi kesinlikle karıştırılmamalıdır.
 *
 * Anahtarlar burada okunabilirlik için ham hâlleriyle yazılır; eşleştirme
 * aşağıdaki INGREDIENT_ALLERGEN_LOOKUP üzerinden normalize edilmiş anahtarla
 * yapılır (bkz. buildLookup).
 *
 * Kapsam: 2026-09-06 tarihinde ölçülen 139 benzersiz malzeme adı
 * (örneklemler: repo public/data ID'leri, id 1..260, ID kümeleri 261..8430).
 */
export const INGREDIENT_ALLERGENS: Record<string, AllergenMap> = {
  // ── GLUTEN (kesin) ─────────────────────────────────────────────────
  UN: { gluten: "kesin" },
  "EKMEK SOMUN": { gluten: "kesin" },
  "EKMEK ROLL": { gluten: "kesin" },
  MAKARNA: { gluten: "kesin" },
  "ERİŞTE MAKARNA": { gluten: "kesin", yumurta: "muhtemel" },
  "TEL ŞEHRİYE": { gluten: "kesin" },
  "ARPA ŞEHRİYE": { gluten: "kesin" },
  İRMİK: { gluten: "kesin" },
  BULGUR: { gluten: "kesin" },
  DÖĞME: { gluten: "kesin" }, // buğday dövmesi
  YUFKA: { gluten: "kesin" },
  MANTI: { gluten: "kesin", yumurta: "muhtemel" },
  "TAŞ KADAYIF": { gluten: "kesin" },
  "TEL KADAYIF": { gluten: "kesin" },
  "TULUMBA TATLI": { gluten: "kesin", sut: "muhtemel", yumurta: "muhtemel" },
  ŞEKERPARE: { gluten: "kesin", sut: "muhtemel", yumurta: "muhtemel" },
  "HALKA TATLI": { gluten: "kesin", yumurta: "muhtemel" },
  "LAHMACUN PİŞİRME": { gluten: "kesin" },
  "PİLİÇ PANE": { gluten: "kesin", yumurta: "muhtemel", soya: "muhtemel" },
  "BALIK PANE": {
    balik: "kesin",
    gluten: "kesin", // galeta unu kaplama
    yumurta: "muhtemel",
    soya: "muhtemel",
  },
  "İÇLİ KÖFTE (3 Adet)": { gluten: "kesin" }, // bulgur + irmik
  "CEVİZLİ BAKLAVA": {
    gluten: "kesin", // yufka
    sert_kabuklu: "kesin", // ceviz
    sut: "muhtemel", // tereyağ
  },
  // TODO: doğrula — Karakuş/Kartakuş tatlısı yörelere göre ceviz veya fıstıkla
  // yapılır; ikisi de sert kabuklu. İçi boş yapan tarifler de var.
  "KARTAKUŞ TATLISI": {
    gluten: "kesin",
    sert_kabuklu: "muhtemel",
    yumurta: "muhtemel",
    sut: "muhtemel",
  },
  // Mustafakemalpaşa (peynir) tatlısı: irmik/un + tuzsuz taze peynir
  Kemalpaşa: { gluten: "kesin", sut: "kesin", yumurta: "muhtemel" },

  // ── GLUTEN (muhtemel) ──────────────────────────────────────────────
  NİŞASTA: { gluten: "muhtemel" }, // buğday nişastası olabilir
  "KABARTMA TOZU": { gluten: "muhtemel" }, // nişasta dolgusu
  "PARMAK PATATES DONMUŞ": { gluten: "muhtemel" }, // kaplamalı olabilir
  HELVA: { susam: "muhtemel", gluten: "muhtemel" }, // tahin mi irmik mi?

  // ── SÜT ────────────────────────────────────────────────────────────
  SÜT: { sut: "kesin" },
  YOĞURT: { sut: "kesin" },
  "SÜZME YOĞURT": { sut: "kesin" },
  AYRAN: { sut: "kesin" },
  TEREYAĞ: { sut: "kesin" },
  "KAŞAR PEYNİRİ": { sut: "kesin" },
  "TAM YAĞLI BEYAZ PEYNİR": { sut: "kesin" },
  "LOR PEYNİRİ": { sut: "kesin" },
  DONDURMA: { sut: "kesin", yumurta: "muhtemel", soya: "muhtemel" },
  PUDİNG: { sut: "kesin", yumurta: "muhtemel", soya: "muhtemel" },
  "BİTKİSEL MARGARİN": { soya: "muhtemel", sut: "muhtemel" },
  // TODO: doğrula — "pastalık yağ" genelde bitkisel margarin türevi
  "PASTALIK YAĞ": { soya: "muhtemel", sut: "muhtemel" },

  // ── YUMURTA ────────────────────────────────────────────────────────
  YUMURTA: { yumurta: "kesin" },

  // ── SUSAM / SERT KABUKLU ───────────────────────────────────────────
  SUSAM: { susam: "kesin" },
  "CEVİZ İÇİ": { sert_kabuklu: "kesin" },
  "ÇAM FISTIĞI": { sert_kabuklu: "kesin" },
  "HİNDİSTAN CEVİZİ": { sert_kabuklu: "muhtemel" }, // EU listesinde değil,
  // ABD/FDA'da tree nut

  // ── BALIK ──────────────────────────────────────────────────────────
  "BALIK DONMUŞ": { balik: "kesin" },

  // ── SOYA / KEREVİZ / HARDAL (bileşik ürünler) ──────────────────────
  "TAVUK BULYON": { soya: "muhtemel", kereviz: "muhtemel", gluten: "muhtemel" },
  KÖRİ: { hardal: "muhtemel", kereviz: "muhtemel" },
  // TODO: doğrula — "çeşni" tanımsız bir baharat/harç karışımı; içeriği
  // bilinmiyor, bu yüzden bileşik ürün gibi agresif işaretlendi.
  ÇESNİ: {
    hardal: "muhtemel",
    kereviz: "muhtemel",
    gluten: "muhtemel",
    soya: "muhtemel",
  },

  // ── SÜLFİT ─────────────────────────────────────────────────────────
  "KURU KAYISI": { sulfit: "muhtemel" },
  "KURU ÜZÜM": { sulfit: "muhtemel" },
  "KURU İNCİR": { sulfit: "muhtemel" },
  "KUŞ ÜZÜMÜ": { sulfit: "muhtemel" },
  SİRKE: { sulfit: "muhtemel" },
  ŞALGAM: { sulfit: "muhtemel" },
  "SALATALIK TURŞUSU": { sulfit: "muhtemel" },
  "KARIŞIK TURŞU": { sulfit: "muhtemel" },
  PEKMEZ: { sulfit: "muhtemel" },

  // ── ALERJEN TESPİT EDİLMEDİ (bilinçli boş) ─────────────────────────
  ARMUT: {},
  "AYSBERG MARUL": {},
  "AYÇİÇEK YAĞI": {},
  "BAMYA DONMUŞ": {},
  BARBUNYA: {},
  "BEZELYE DONMUŞ": {},
  BROKOLİ: {},
  "BİBER SALÇASI": {},
  "DERE OTU": {},
  "DOLMALIK BİBER": {},
  DOMATES: {},
  "DOMATES SALÇASI": {},
  ELMA: {},
  ERİK: {},
  GÜLSUYU: {},
  HAVUÇ: {},
  "ISPANAK DONMUŞ": {},
  KABAK: {},
  "KAPYA BİBER": {},
  KARABİBER: {},
  KARNABAHAR: {},
  KARPUZ: {},
  KAVUN: {},
  KAYISI: {},
  KEKİK: {},
  "KEMER PATLICAN": {},
  "KIRMIZI LAHANA": {},
  "KIRMIZI MERCİMEK": {},
  "KURU FASULYE": {},
  "KURU NANE": {},
  "KURU SOĞAN": {},
  "KÜLTÜR MANTARI": {},
  KİMYON: {},
  KİRAZ: {},
  LAHANA: {},
  LİMON: {},
  "LİMON TUZU": {},
  MANDALİN: {},
  MAYDANOZ: {},
  "MISIR DONUK": {},
  MUZ: {},
  NEKTARİN: {},
  NOHUT: {},
  PATATES: {},
  "PATLICAN  (TOPAK)": {},
  PIRASA: {},
  PORTAKAL: {},
  PULBİBER: {},
  PİRİNÇ: {},
  "PİRİNÇ UNU": {}, // pirinç unu glutensizdir
  ROKA: {},
  SALATALIK: {},
  SARIMSAK: {},
  TARÇIN: {},
  "TAZE FASULYE DONMUŞ": {},
  "TOZ BİBER": {},
  "TOZ ŞEKER": {},
  TUZ: {},
  VANİLYA: {},
  "YENİ BAHAR": {},
  YENİDÜNYA: {},
  "YEŞİL BİBER": {},
  "YEŞİL MERCİMEK": {},
  "YEŞİL NANE": {},
  ZERDAÇAL: {},
  ZEYTİNYAĞI: {},
  ÜZÜM: {},
  "ÇARLİSTON BİBER": {},
  "ÇÖREK OTU": {},
  ŞEFTALİ: {},

  // ── ET / HAYVANSAL (alerjen değil, diyet işareti) ──────────────────
  "DANA ETİ": {},
  "KOYUN ETİ(KEMİKSİZ)": {},
  "HİNDİ ETİ": {},
  "BAGET TAVUK": {},
  "TÜM TAVUK ETİ": {},
  "KEMİKSİZ DERİSİZ BUT BONFİLE": {},
  "KEMİKSİZ DERİSİZ GÖĞÜS BONFİLE": {},
  "BUT SPESİYAL": {},
  TAŞLIK: {},
  "KUYRUK YAĞI": {},
  KAKAO: {},
};

/**
 * Malzeme adlarını normalize eder.
 *
 * Site tutarsız yazıyor: `PATLICAN  (TOPAK)` çift boşluklu, `BİBER SALÇASI.`
 * sonda nokta, `Kemalpaşa` karışık kutu, ad ile miktar arasında &nbsp;.
 *
 * toLocaleUpperCase("tr-TR") KRİTİK: düz toUpperCase() "irmik" → "IRMIK" yapar,
 * "İRMİK" ile eşleşmez ve sessiz bir yanlış negatif doğar.
 */
export function normalizeIngredient(raw: string): string {
  return raw
    .replace(/\s+/g, " ") // çoklu boşluk + &nbsp; tekilleşir
    .replace(/[.\s]+$/, "") // sondaki nokta/boşluk
    .trim()
    .toLocaleUpperCase("tr-TR");
}

/**
 * Sözlüğün normalize edilmiş hâli. Ham anahtarlar ile arama anahtarı
 * uyuşmazsa sessiz yanlış negatif oluşur (ALERJENPLANI R1'in en olası
 * tetikleyicisi) — bu yüzden arama HER ZAMAN buradan yapılır.
 */
function buildLookup(): Map<string, AllergenMap> {
  const lookup = new Map<string, AllergenMap>();
  for (const [raw, map] of Object.entries(INGREDIENT_ALLERGENS)) {
    const key = normalizeIngredient(raw);
    const existing = lookup.get(key);
    if (existing && JSON.stringify(existing) !== JSON.stringify(map)) {
      // İki ham anahtar aynı şeye normalize oluyor ama farklı etiket taşıyor.
      // Sessizce birini kaybetmek yerine gürültü çıkar.
      throw new Error(
        `allergens: "${key}" için çakışan sözlük girdisi (ham anahtar: "${raw}")`
      );
    }
    lookup.set(key, map);
  }
  return lookup;
}

export const INGREDIENT_ALLERGEN_LOOKUP: ReadonlyMap<string, AllergenMap> =
  buildLookup();

/** Sözlükte tanımlı mı? (boş `{}` de tanımlıdır — "bilinmiyor" değildir) */
export function isKnownIngredient(raw: string): boolean {
  return INGREDIENT_ALLERGEN_LOOKUP.has(normalizeIngredient(raw));
}

function normalizedSet(names: string[]): ReadonlySet<string> {
  return new Set(names.map(normalizeIngredient));
}

export const MEAT_INGREDIENTS = normalizedSet([
  "DANA ETİ",
  "KOYUN ETİ(KEMİKSİZ)",
  "HİNDİ ETİ",
  "BAGET TAVUK",
  "TÜM TAVUK ETİ",
  "KEMİKSİZ DERİSİZ BUT BONFİLE",
  "KEMİKSİZ DERİSİZ GÖĞÜS BONFİLE",
  "BUT SPESİYAL",
  "TAŞLIK",
  "KUYRUK YAĞI",
  "BALIK DONMUŞ",
  "BALIK PANE",
  "TAVUK BULYON",
]);

export const ANIMAL_DERIVED_INGREDIENTS = normalizedSet([
  ...MEAT_INGREDIENTS,
  "SÜT",
  "YOĞURT",
  "SÜZME YOĞURT",
  "AYRAN",
  "TEREYAĞ",
  "KAŞAR PEYNİRİ",
  "TAM YAĞLI BEYAZ PEYNİR",
  "LOR PEYNİRİ",
  "DONDURMA",
  "PUDİNG",
  "YUMURTA",
  "Kemalpaşa",
]);

export interface MealAllergenResult {
  allergens: AllergenHit[];
  /** Sözlükte bulunmayan malzemeler — yemeği "eksik veri" durumuna düşürür */
  unmapped: string[];
  dietFlags: { hasMeat: boolean; hasAnimalProduct: boolean };
}

/**
 * Bir yemeğin malzeme listesinden alerjen kümesini çıkarır.
 *
 * Bilinmeyen malzeme alerjen üretmez ama SESSİZCE GEÇİLMEZ: `unmapped`
 * dizisine düşer ve çağıran taraf bunu "eksik veri" olarak göstermek
 * zorundadır (ALERJENPLANI 6.3).
 */
export function computeMealAllergens(
  ingredientNames: string[]
): MealAllergenResult {
  const acc = new Map<AllergenId, AllergenHit>();
  const unmapped: string[] = [];
  let hasMeat = false;
  let hasAnimalProduct = false;

  for (const raw of ingredientNames) {
    const key = normalizeIngredient(raw);
    if (!key) continue;

    if (MEAT_INGREDIENTS.has(key)) hasMeat = true;
    if (ANIMAL_DERIVED_INGREDIENTS.has(key)) hasAnimalProduct = true;

    const map = INGREDIENT_ALLERGEN_LOOKUP.get(key);

    if (map === undefined) {
      if (!unmapped.includes(key)) unmapped.push(key);
      continue;
    }

    for (const [id, conf] of Object.entries(map) as [
      AllergenId,
      Confidence,
    ][]) {
      const existing = acc.get(id);
      if (!existing) {
        acc.set(id, { id, confidence: conf, from: [key] });
      } else {
        // "kesin" her zaman "muhtemel"i ezer
        if (conf === "kesin") existing.confidence = "kesin";
        if (!existing.from.includes(key)) existing.from.push(key);
      }
    }
  }

  const allergens = [...acc.values()].sort(
    (a, b) => ALLERGEN_ORDER.indexOf(a.id) - ALLERGEN_ORDER.indexOf(b.id)
  );

  return { allergens, unmapped, dietFlags: { hasMeat, hasAnimalProduct } };
}

export type DietPreference = "none" | "vegetarian" | "vegan";

export interface DietFlags {
  hasMeat: boolean;
  hasAnimalProduct: boolean;
}

export const DIET_CONFLICT_LABELS = {
  meat: "Et içeriyor",
  animal: "Hayvansal ürün içeriyor",
} as const;

export type DietConflict = keyof typeof DIET_CONFLICT_LABELS;

/**
 * Yemek, kullanıcının beslenme tercihine aykırı mı?
 *
 * Alerjen değil, diyet işareti — ama aynı sözleşmeye tabi: "bunda et var"
 * denir, "bu vegan" DENMEZ. Reçetede görünmeyen hayvansal içerik
 * (jelatin, bulyon içindeki yağ vb.) tespit edilemez.
 */
export function dietConflict(
  flags: DietFlags | undefined,
  preference: DietPreference
): DietConflict | null {
  if (!flags || preference === "none") return null;
  if (flags.hasMeat) return "meat";
  if (preference === "vegan" && flags.hasAnimalProduct) return "animal";
  return null;
}

/**
 * Kullanıcının seçtiği alerjenlerle eşleşenleri süzer.
 *
 * Modal, menü kartı ve e-posta bildirimi aynı fonksiyonu kullanır — üç yerde
 * üç ayrı süzme mantığı, birinin sessizce farklı davranması demek olurdu.
 *
 * `includeProbable = false` ise yalnızca "kesin" eşleşmeler döner: hafif
 * hassasiyeti olan kullanıcı her yemekte margarin uyarısı almasın diye.
 * Çölyak gibi durumlar için varsayılan true'dur.
 */
export function filterHitsForUser(
  hits: AllergenHit[],
  selected: readonly AllergenId[],
  includeProbable: boolean
): AllergenHit[] {
  if (selected.length === 0) return [];
  const wanted = new Set(selected);
  return hits.filter(
    (hit) =>
      wanted.has(hit.id) && (includeProbable || hit.confidence === "kesin")
  );
}
