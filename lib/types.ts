import type { AllergenHit } from './allergens';

export interface MenuData {
  month: string;           // "2025-11"
  lastUpdated: string;     // ISO timestamp
  scrapeDate: string;      // "2025-11-15"
  totalDays: number;       // 20
  days: DayMenu[];
}

export interface DayMenu {
  ymk: number;             // 1, 2, 3...
  date: string;            // "2025-11-03" (ISO format)
  dayName: string;         // "Pazartesi"
  hasData: boolean;        // true = veri var, false = veri yok
  meals: Meal[];           // hasData=false ise boş array
  totalCalories: number;   // 797
}

export interface Meal {
  id: string;              // "157"
  name: string;            // "Ekşili Köfte"
  calories: number;        // 294
  category: MealCategory;  // "ana_yemek"

  // ── Alerjen zenginleştirmesi ──────────────────────────────────────
  // Hepsi OPSİYONEL: public/data'daki eski JSON dosyaları bu alanları
  // içermiyor ve okunmaya devam etmeli. Okuyan her yer undefined'ı ele almalı.

  // NOT: malzeme listesi bilerek burada tutulmaz. Yemekhane, ID'yi
  // değiştirmeden reçeteyi güncelleyebiliyor; bayat bir kopya göstermektense
  // detay modalı her açılışta canlı çeker.
  allergens?: AllergenHit[];
  /** Sözlükte bulunmayan malzemeler → yemek "eksik veri" durumundadır */
  unmappedIngredients?: string[];
  dietFlags?: { hasMeat: boolean; hasAnimalProduct: boolean };
  /** ISO timestamp — reçete ID sabitken değişebildiği için tazelik göstergesi */
  enrichedAt?: string;
  /** Detay sayfası çekilemedi; alerjen bilgisi YOK, "temiz" demek değil */
  enrichmentFailed?: boolean;
}

export type MealCategory =
  | "ana_yemek"      // Et yemekleri, tavuk vb.
  | "yan_yemek"      // Pilav, makarna
  | "corba"          // Çorbalar
  | "yan_urun"       // Yoğurt, ayran, turşu, salata
  | "tatli"          // Tatlılar, meyveler
  | "icecek";        // Şalgam vb.

export interface MealDetail {
  id: string;
  name: string;
  calories: number;
  imageUrl: string | null;
  ingredients: Ingredient[];
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

