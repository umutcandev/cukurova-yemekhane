import { Suspense } from "react"
import { loadAllMenuData } from "@/lib/menu-loader"
import MenuPage from "./menu-page"

// Her sayfa ziyaretinde menü verisi sunucudan taze çekilir; ISR/önbellek kullanılmaz.
// Açık sekmelerdeki gün değişimi ise client tarafında use-day-change hook'u ile algılanır.
export const dynamic = "force-dynamic"

export default async function Home() {
  try {
    const menuData = await loadAllMenuData()
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
