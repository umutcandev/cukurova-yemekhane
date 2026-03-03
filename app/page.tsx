import { Suspense } from "react"
import { loadMenuData } from "@/lib/menu-loader"
import { getCurrentMonth } from "@/lib/date-utils"
import MenuPage from "./menu-page"

// Menü verisi her seferinde sunucudan çekilir; eski cache kullanıcılara yanlış menü gösteriyordu.
// Client tarafında gün değişimi tespiti (use-day-change hook) ile de otomatik yenileme yapılır.
export const revalidate = 60 // 1 dakika

export default async function Home() {
  try {
    const menuData = await loadMenuData(getCurrentMonth())
    return (
      <Suspense>
        <MenuPage menuData={menuData} />
      </Suspense>
    )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Veri Bulunamadı</h1>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Menü verisi yüklenemedi."}
          </p>
          <p className="text-sm text-muted-foreground">
            Lütfen <code className="bg-muted px-2 py-1 rounded">pnpm scrape</code> komutunu çalıştırarak veri oluşturun.
          </p>
        </div>
      </div>
    )
  }
}
