"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { UtensilsIcon, MoreVertical } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

import { MealDetailModal } from "@/components/meal-detail-modal"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import type { DateRange } from "react-day-picker"
import type { MenuData } from "@/lib/types"

function formatDate(dateString: string) {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        weekday: "long",
    }
    return date.toLocaleDateString("tr-TR", options)
}

function formatDayName(dateString: string) {
    const date = new Date(dateString)
    const dayName = date.toLocaleDateString("tr-TR", { weekday: "long" })
    return dayName.charAt(0).toUpperCase() + dayName.slice(1) + " Menüsü"
}


function formatDateShort(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    })
}


function getCalorieBadgeClasses(calories: number): string {
    const baseClasses = "font-mono border"
    if (calories < 800) {
        // Yeşil - düşük kalori
        return `${baseClasses} border-green-500 text-green-700 dark:text-green-400 bg-green-500/10`
    }
    if (calories < 1100) {
        // Turuncu - orta kalori
        return `${baseClasses} border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-500/10`
    }
    // Kırmızı - yüksek kalori
    return `${baseClasses} border-red-500 text-red-700 dark:text-red-400 bg-red-500/10`
}

export default function MenuPage({ menuData }: { menuData: MenuData }) {

    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined)
    const [selectedMeal, setSelectedMeal] = useState<{ id: string; name: string; calories: number } | null>(null)

    // Find today's date or nearest available date for mobile initial view
    const findInitialDateIndex = (): number => {
        const today = new Date().toISOString().split("T")[0]

        // Try to find today's menu
        const todayIndex = menuData.days.findIndex((day) => day.date === today)
        if (todayIndex !== -1) return todayIndex

        // If today not found, find nearest future date
        const futureIndex = menuData.days.findIndex((day) => day.date > today)
        if (futureIndex !== -1) return futureIndex

        // If no future dates, use the last available date
        return menuData.days.length - 1
    }

    const [mobileSelectedDateIndex, setMobileSelectedDateIndex] = useState<number>(findInitialDateIndex())
    const today = new Date().toISOString().split("T")[0]

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
        }
    }

    const handleMobileNext = () => {
        if (mobileSelectedDateIndex < availableDates.length - 1) {
            setMobileSelectedDateIndex(mobileSelectedDateIndex + 1)
        }
    }

    const mobileCurrentDate = availableDates[mobileSelectedDateIndex]
    const mobileCurrentMenu = menuData.days[mobileSelectedDateIndex]

    return (
        <main className="min-h-screen bg-background pb-20 md:pb-8">
            {/* Header */}
            <header className="dark text-foreground sticky top-0 z-50 border-b border-border bg-background">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="relative h-12 w-48 md:w-56">
                            <Image
                                src="/logo-cu.png"
                                alt="ÇÜ Yemekhane"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 md:py-8">


                {/* Mobile Menu View - Shows selected date(s) from mobile navigation */}
                <section className="max-w-md mx-auto">
                    {selectedDateRange?.from && selectedDateMenus.length > 0 ? (
                        // Show range of menus if date range is selected
                        <div className="grid gap-4">
                            {selectedDateMenus.map((day) => (
                                <Card key={day.ymk} className="border border-border/40 bg-card overflow-hidden shadow-sm">
                                    <div className="bg-muted/20 px-3 py-2 border-b border-border/40">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-lg font-semibold text-foreground tracking-tight">{formatDayName(day.date)}</div>
                                            <Badge variant="outline" className="text-xs font-mono font-normal">
                                                {formatDateShort(day.date)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground/60 leading-none">
                                            Menüler yemekhane sitesinden alınmaktadır.
                                        </p>
                                    </div>

                                    <div className="px-3">
                                        <div className="space-y-0">
                                            {day.meals.map((meal, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-t border-border/40 first:border-t-0"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <UtensilsIcon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                                                        <span
                                                            className="font-medium text-sm text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                                                            onClick={() => handleMealClick(meal.id, meal.name, meal.calories)}
                                                        >
                                                            {meal.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 pl-2">
                                                        <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-2 text-muted-foreground bg-secondary/50 hover:bg-secondary/70">
                                                            {meal.calories} kcal
                                                        </Badge>
                                                        <button
                                                            onClick={() => handleMealClick(meal.id, meal.name, meal.calories)}
                                                            className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground/70 hover:text-foreground"
                                                            aria-label="Detayları göster"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-border/40 bg-muted/20 px-3 py-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Toplam Kalori</span>
                                        </div>
                                        <Badge
                                            className={`${getCalorieBadgeClasses(day.totalCalories)} text-xs px-3 py-1 font-mono`}
                                        >
                                            {day.totalCalories} kcal
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : mobileCurrentMenu ? (
                        // Show single menu from arrow navigation
                        <div className="max-w-md mx-auto">
                            <Card className="border border-border/40 bg-card overflow-hidden shadow-sm">
                                <div className="bg-muted/20 px-3 py-3 border-b border-border/40">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-lg font-semibold text-foreground tracking-tight">{formatDayName(mobileCurrentMenu.date)}</div>
                                        <Badge variant="outline" className="text-xs font-mono font-normal">
                                            {formatDateShort(mobileCurrentMenu.date)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground/60 leading-none">
                                        Menüler yemekhane sitesinden alınmaktadır.
                                    </p>
                                </div>

                                <div className="px-3">
                                    <div className="space-y-0">
                                        {mobileCurrentMenu.meals.map((meal, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-t border-border/40 first:border-t-0"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <UtensilsIcon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                                                    <span
                                                        className="font-medium text-sm text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                                                        onClick={() => handleMealClick(meal.id, meal.name, meal.calories)}
                                                    >
                                                        {meal.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 pl-2">
                                                    <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-2 text-muted-foreground bg-secondary/50 hover:bg-secondary/70">
                                                        {meal.calories} kcal
                                                    </Badge>
                                                    <button
                                                        onClick={() => handleMealClick(meal.id, meal.name, meal.calories)}
                                                        className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground/70 hover:text-foreground"
                                                        aria-label="Detayları göster"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-border/40 bg-muted/20 px-3 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Toplam Kalori</span>
                                    </div>
                                    <Badge
                                        className={`${getCalorieBadgeClasses(mobileCurrentMenu.totalCalories)} text-xs px-3 py-1 font-mono`}
                                    >
                                        {mobileCurrentMenu.totalCalories} kcal
                                    </Badge>
                                </div>
                            </Card>
                        </div>
                    ) : null}
                </section>




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
