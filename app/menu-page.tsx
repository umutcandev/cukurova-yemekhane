"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MealDetailModal } from "@/components/meal-detail-modal"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MenuCard } from "@/components/menu-card"
import { Header } from "@/components/header"
import { MenuDataProvider } from "@/components/menu-data-provider"
import { getTurkeyDate } from "@/lib/date-utils"
import { useDayChange } from "@/hooks/use-day-change"
import { X } from "lucide-react"

import type { DateRange } from "react-day-picker"
import type { MenuData } from "@/lib/types"


export default function MenuPage({ menuData }: { menuData: MenuData }) {
    // Tarih her zaman client'ta hesaplanır — cache'li sayfada bile doğru değer döner.
    const initialDate = getTurkeyDate()

    // JSON aralığındaki tüm eksik günler + bugün için sentetik girişler oluştur
    const [augmentedDays] = useState(() => {
        if (menuData.days.length === 0) return menuData.days

        const existingDates = new Set(menuData.days.map((day) => day.date))
        const syntheticDays: typeof menuData.days = []

        // JSON'daki ilk ve son tarih arasındaki tüm eksik günleri bul
        const firstDate = menuData.days[0].date
        const lastDate = menuData.days[menuData.days.length - 1].date
        const current = new Date(firstDate + "T00:00:00")
        const end = new Date(lastDate + "T00:00:00")

        while (current <= end) {
            const dateStr = current.toISOString().split("T")[0]
            if (!existingDates.has(dateStr)) {
                syntheticDays.push({
                    ymk: 0,
                    date: dateStr,
                    dayName: current.toLocaleDateString("tr-TR", {
                        weekday: "long",
                        timeZone: "Europe/Istanbul",
                    }),
                    hasData: false,
                    meals: [],
                    totalCalories: 0,
                })
            }
            current.setDate(current.getDate() + 1)
        }

        // Bugün aralık dışındaysa ve veride yoksa, bugün için de ekle
        if (!existingDates.has(initialDate) && (initialDate < firstDate || initialDate > lastDate)) {
            syntheticDays.push({
                ymk: 0,
                date: initialDate,
                dayName: new Date(initialDate + "T00:00:00").toLocaleDateString("tr-TR", {
                    weekday: "long",
                    timeZone: "Europe/Istanbul",
                }),
                hasData: false,
                meals: [],
                totalCalories: 0,
            })
        }

        if (syntheticDays.length === 0) return menuData.days

        const days = [...menuData.days, ...syntheticDays]
        days.sort((a, b) => a.date.localeCompare(b.date))
        return days
    })

    // menuData.days yerine augmentedDays kullan
    const effectiveMenuData = { ...menuData, days: augmentedDays }

    // Gün değişimini izle; yeni güne geçildiğinde sayfayı otomatik yenile.
    useDayChange()

    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined)
    const [selectedMeal, setSelectedMeal] = useState<{ id: string; name: string; calories: number } | null>(null)
    const [showNotice, setShowNotice] = useState(false)

    useEffect(() => {
        const hiddenUntil = localStorage.getItem('hide-github-notice-until')
        if (!hiddenUntil || new Date().getTime() > parseInt(hiddenUntil)) {
            setShowNotice(true)
        }
    }, [])

    const handleDismissNotice = () => {
        setShowNotice(false)
        const thirtyDaysFromNow = new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        localStorage.setItem('hide-github-notice-until', thirtyDaysFromNow.toString())
    }

    // Find today's date or nearest available date for mobile initial view
    const findInitialDateIndex = (): number => {
        // Use server-provided date to avoid hydration mismatch
        const today = initialDate

        // Try to find today's menu
        const todayIndex = effectiveMenuData.days.findIndex((day) => day.date === today)
        if (todayIndex !== -1) return todayIndex

        // If today not found, find nearest future date
        const futureIndex = effectiveMenuData.days.findIndex((day) => day.date > today)
        if (futureIndex !== -1) return futureIndex

        // If no future dates, use the last available date
        return effectiveMenuData.days.length - 1
    }

    const [mobileSelectedDateIndex, setMobileSelectedDateIndex] = useState<number>(findInitialDateIndex())

    // URL'den ?date= parametresini oku → arama sonuçlarından navigasyon
    const searchParams = useSearchParams()
    useEffect(() => {
        const dateParam = searchParams.get("date")
        if (dateParam) {
            const targetIndex = effectiveMenuData.days.findIndex((day) => day.date === dateParam)
            if (targetIndex !== -1) {
                setMobileSelectedDateIndex(targetIndex)
                setSelectedDateRange(undefined)
            }
        }
    }, [searchParams, effectiveMenuData.days])

    // Use initialDate here as well to avoid mismatch
    const today = initialDate

    const todayMenu = effectiveMenuData.days.find((day) => day.date === today)

    // Create dates in local timezone to avoid off-by-one errors
    const availableDates = effectiveMenuData.days.map((day) => {
        const [year, month, dayNum] = day.date.split("-").map(Number)
        return new Date(year, month - 1, dayNum)
    })

    const selectedDateMenus = selectedDateRange?.from
        ? effectiveMenuData.days.filter((day) => {
            const dayDateStr = day.date // Already in ISO format: "2025-11-03"
            // Convert Date to local date string (YYYY-MM-DD) without timezone conversion
            const fromDate = selectedDateRange.from!
            const fromStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`
            const toDate = selectedDateRange.to || selectedDateRange.from!
            const toStr = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`
            return dayDateStr >= fromStr && dayDateStr <= toStr
        })
        : []

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setSelectedDateRange(range)
    }

    const handleCancel = () => {
        setSelectedDateRange(undefined)
    }

    const handleMealClick = (mealId: string, mealName: string, mealCalories: number) => {
        setSelectedMeal({ id: mealId, name: mealName, calories: mealCalories })
    }

    const handleModalClose = () => {
        setSelectedMeal(null)
    }

    // Mobile navigation handlers
    const handleMobileDateRangeSelect = (range: DateRange | undefined) => {
        if (range?.from) {
            // Find the index of the selected date
            const index = availableDates.findIndex(
                (d) => d.toISOString().split("T")[0] === range.from!.toISOString().split("T")[0]
            )
            if (index !== -1) {
                setMobileSelectedDateIndex(index)
            }
            // Also update the selected date range for potential display
            setSelectedDateRange(range)
        }
    }

    const handleMobilePrevious = () => {
        if (mobileSelectedDateIndex > 0) {
            setMobileSelectedDateIndex(mobileSelectedDateIndex - 1)
            setSelectedDateRange(undefined)
        }
    }

    const handleMobileNext = () => {
        if (mobileSelectedDateIndex < availableDates.length - 1) {
            setMobileSelectedDateIndex(mobileSelectedDateIndex + 1)
            setSelectedDateRange(undefined)
        }
    }

    const mobileCurrentDate = availableDates[mobileSelectedDateIndex]
    const mobileCurrentMenu = effectiveMenuData.days[mobileSelectedDateIndex]

    return (
        <main className="min-h-screen bg-background pb-20 md:pb-8">
            <Header />

            <div className="container mx-auto px-4 py-6 md:py-8">

                {/* Notice Banner */}
                {showNotice && (
                    <div className="max-w-md mx-auto mb-4 relative">
                        <button
                            onClick={handleDismissNotice}
                            className="absolute top-1 right-1 text-muted-foreground/60 hover:text-foreground transition-colors p-1.5 rounded-sm hover:bg-muted/50"
                            aria-label="Kapat"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        <p className="block border border-dashed border-border rounded-lg px-3 py-3 text-xs text-muted-foreground/80 bg-muted/20">
                            Bu proje <a href="https://yemekhane.cu.edu.tr/" title="Çukurova Yemekhane" target="_blank" rel="noopener noreferrer nofollow" style={{ textDecoration: "underline" }}>Çukurova Üniversitesinden</a> bağımsız, tamamen gönüllü ve <a href="https://github.com/umutcandev/cukurova-yemekhane" title="Çukurova Yemekhane GitHub" target="_blank" rel="noopener noreferrer nofollow" style={{ textDecoration: "underline" }}>açık kaynak</a> geliştirilmektedir.
                        </p>
                    </div>
                )}

                {/* MenuDataProvider — favorites, calorie-goal, daily-log API çağrıları burada 1 kez yapılır */}
                <MenuDataProvider>
                    {/* Mobile Menu View - Shows selected date(s) from mobile navigation */}
                    <section className="max-w-md mx-auto">



                        {selectedDateRange?.from && selectedDateMenus.length > 0 ? (
                            // Show range of menus if date range is selected
                            <div className="grid gap-4">
                                {selectedDateMenus.map((day) => (
                                    <MenuCard key={day.date} day={day} onMealClick={handleMealClick} />
                                ))}
                            </div>
                        ) : mobileCurrentMenu ? (
                            // Show single menu from arrow navigation
                            <div className="max-w-md mx-auto">
                                <MenuCard day={mobileCurrentMenu} onMealClick={handleMealClick} />
                            </div>
                        ) : null}
                    </section>
                </MenuDataProvider>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav
                availableDates={availableDates}
                currentDate={mobileCurrentDate}
                onDateRangeSelect={handleMobileDateRangeSelect}
                onPrevious={handleMobilePrevious}
                onNext={handleMobileNext}
                canGoPrevious={mobileSelectedDateIndex > 0}
                canGoNext={mobileSelectedDateIndex < availableDates.length - 1}
                lastUpdated={menuData.lastUpdated}
                totalDays={menuData.totalDays}
            />

            {/* Meal Detail Modal */}
            {selectedMeal && (
                <MealDetailModal
                    mealId={selectedMeal.id}
                    mealName={selectedMeal.name}
                    mealCalories={selectedMeal.calories}
                    open={!!selectedMeal}
                    onOpenChange={handleModalClose}
                />
            )}
        </main>
    )
}
