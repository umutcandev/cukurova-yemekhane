"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Uygulama hatasi:", error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
            <h2 className="text-xl font-semibold">Bir hata olustu</h2>
            <p className="text-sm text-muted-foreground">
                Beklenmeyen bir sorun meydana geldi. Sayfayi yeniden yuklemeyi deneyin.
            </p>
            <Button onClick={reset}>Tekrar dene</Button>
        </div>
    )
}
