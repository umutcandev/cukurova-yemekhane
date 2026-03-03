"use client"

import { useEffect } from "react"
import { getTurkeyDate } from "@/lib/date-utils"

/**
 * Gün değişimini tespit eder ve sayfa yüklendiğindeki günden farklı bir güne
 * geçildiğinde `window.location.reload()` ile sayfayı yeniler.
 *
 * Bu sayede eski sekmede bekleyen kullanıcılar yeni güne geçildiğinde
 * otomatik olarak güncel menüyü görür.
 */
export function useDayChange() {
    useEffect(() => {
        const CHECK_INTERVAL_MS = 60_000 // Her dakika kontrol et
        const mountDate = getTurkeyDate()

        const intervalId = setInterval(() => {
            const currentDate = getTurkeyDate()
            if (currentDate !== mountDate) {
                clearInterval(intervalId)
                window.location.reload()
            }
        }, CHECK_INTERVAL_MS)

        return () => clearInterval(intervalId)
    }, [])
}
