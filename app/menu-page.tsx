"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { MealDetailModal } from "@/components/meal-detail-modal"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { InfoDialog } from "@/components/info-dialog"
import { MenuCard } from "@/components/menu-card"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"
import type { MenuData } from "@/lib/types"


export default function MenuPage({ menuData, initialDate }: { menuData: MenuData, initialDate: string }) {

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
            {/* Header */}
            <header className="dark text-foreground sticky top-0 z-50 border-b border-border bg-background">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="relative h-9 w-40 md:w-48">
                            <Image
                                src="/logo-cu.png"
                                alt="ÇÜ Yemekhane"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-auto px-2 border border-border/40 gap-2" asChild>
                                <Link href="https://github.com/umutcandev/cukurova-yemekhane" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                        <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z" />
                                    </svg>
                                    <span className="text-muted-foreground text-xs">umutcandev</span>
                                </Link>
                            </Button>
                            <InfoDialog />
                            <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
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
