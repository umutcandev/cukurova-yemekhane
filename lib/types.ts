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

