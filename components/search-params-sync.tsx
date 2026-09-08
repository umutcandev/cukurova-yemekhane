"use client"

import { useEffect } from "react"
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"

/**
 * useSearchParams'ı sayfa kökünden uzak tutar.
 *
 * Hook en üstteki client bileşeninde çağrılırsa Next.js onu saran Suspense
 * sınırını sunucuda render etmekten vazgeçiyor; ana sayfanın ham HTML'i o
 * yüzden menüsüz (ve H1'siz) kalıyordu. Hook'u kendi sınırının içine alınca
 * menü tekrar SSR ediliyor, davranış aynı kalıyor.
 *
 * `onChange` referansı kararlı olmalı (useCallback) — aksi halde effect her
 * render'da yeniden çalışır.
 */
export function SearchParamsSync({
    onChange,
}: {
    onChange: (params: ReadonlyURLSearchParams) => void
}) {
    const searchParams = useSearchParams()

    useEffect(() => {
        onChange(searchParams)
    }, [searchParams, onChange])

    return null
}
