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

import type { DateRange } from "react-day-picker"
import type { MenuData } from "@/lib/types"


export default function MenuPage({ menuData }: { menuData: MenuData }) {
    // Tarih her zaman client'ta hesaplanır — cache'li sayfada bile doğru değer döner.
    const initialDate = getTurkeyDate()

    // Gün değişimini izle; yeni güne geçildiğinde sayfayı otomatik yenile.
    useDayChange()

    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined)
    const [selectedMeal, setSelectedMeal] = useState<{ id: string; name: string; calories: number } | null>(null)

    // Find today's date or nearest available date for mobile initial view
    const findInitialDateIndex = (): number => {
        // Use server-provided date to avoid hydration mismatch
        const today = initialDate

        // Try to find today's menu
        const todayIndex = menuData.days.findIndex((day) => day.date === today)
        if (todayIndex !== -1) return todayIndex

        // If today not found, find nearest future date
        const futureIndex = menuData.days.findIndex((day) => day.date > today)
        if (futureIndex !== -1) return futureIndex

        // If no future dates, use the last available date
        // But if today is Saturday/Sunday (which means we passed all weekdays),
        // we might want to stay on Friday or show nothing?
        // Current behavior: show last available (likely Friday)
        return menuData.days.length - 1
    }

    const [mobileSelectedDateIndex, setMobileSelectedDateIndex] = useState<number>(findInitialDateIndex())

    // URL'den ?date= parametresini oku → arama sonuçlarından navigasyon
    const searchParams = useSearchParams()
    useEffect(() => {
        const dateParam = searchParams.get("date")
        if (dateParam) {
            const targetIndex = menuData.days.findIndex((day) => day.date === dateParam)
            if (targetIndex !== -1) {
                setMobileSelectedDateIndex(targetIndex)
                setSelectedDateRange(undefined)
            }
        }
    }, [searchParams, menuData.days])

    // Use initialDate here as well to avoid mismatch
    const today = initialDate

    const todayMenu = menuData.days.find((day) => day.date === today)

    // Create dates in local timezone to avoid off-by-one errors
    const availableDates = menuData.days.map((day) => {
        const [year, month, dayNum] = day.date.split("-").map(Number)
        return new Date(year, month - 1, dayNum)
    })

    const selectedDateMenus = selectedDateRange?.from
        ? menuData.days.filter((day) => {
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
    const mobileCurrentMenu = menuData.days[mobileSelectedDateIndex]

    return (
        <main className="min-h-screen bg-background pb-20 md:pb-8">
            <Header />

            <div className="container mx-auto px-4 py-6 md:py-8">

                {/* MenuDataProvider — favorites, calorie-goal, daily-log API çağrıları burada 1 kez yapılır */}
                <MenuDataProvider>
                    {/* Mobile Menu View - Shows selected date(s) from mobile navigation */}
                    <section className="max-w-md mx-auto">



                        {selectedDateRange?.from && selectedDateMenus.length > 0 ? (
                            // Show range of menus if date range is selected
                            <div className="grid gap-4">
                                {selectedDateMenus.map((day) => (
                                    <MenuCard key={day.ymk} day={day} onMealClick={handleMealClick} />
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

                {/* Ad Banner */}
                <div className="max-w-md mx-auto mt-4">
                    <p
                        className="block border border-dashed border-border rounded-lg px-4 py-3 text-center text-xs text-muted-foreground/80 bg-muted/20"
                    >
                        Bu proje <a href="https://github.com/umutcandev" title="Umutcan Github" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>@umutcandev</a> tarafından <a href="https://github.com/umutcandev/cukurova-yemekhane" title="Çukurova Yemekhane Github" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>açık kaynak</a> geliştirilmektedir, yinede resmi yemekhane sitesini ziyaret etmek istiyorsanız <a href="https://yemekhane.cu.edu.tr" target="_blank" rel="noopener noreferrer nofollow" style={{ textDecoration: "underline" }}>tıklayınız.</a>
                    </p>
                </div>

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
