import { loadMenuData } from "@/lib/menu-loader"
import { getCurrentMonth } from "@/lib/date-utils"
import MenuPage from "./menu-page"

// Menü verisi sabah bir kez yenilenir, gün içinde değişmez.
// Saatte bir revalidate yeterli — force-dynamic gereksiz Edge invocation yaratıyordu.
// Güncel tarih (getTurkeyDate) ise client-side'da hesaplandığından her zaman doğrudur.
export const revalidate = 3600 // 1 saat

export default async function Home() {
  try {
    const menuData = await loadMenuData(getCurrentMonth())
    return <MenuPage menuData={menuData} />
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
