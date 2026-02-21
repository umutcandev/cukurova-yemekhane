"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Flame, ArrowLeft, Loader2, Trash2, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { toast } from "sonner"
import { toTitleCase } from "@/lib/utils"
import { Header } from "@/components/header"
import { useCalorieGoal } from "@/hooks/use-calorie-goal"
import { CalorieGoalModal } from "@/components/calorie-goal-modal"
import { MealDetailModal } from "@/components/meal-detail-modal"

interface ConsumedMeal {
    mealName: string
    calories: number
    mealId: string
}

interface DayLog {
    date: string
    totalCalories: number
    consumedMeals: ConsumedMeal[]
}

// Color palette for pie chart segments (meal-based hues)
const MEAL_COLORS = [
    "hsl(210, 70%, 65%)",   // soft blue
    "hsl(340, 65%, 65%)",   // rose pink
    "hsl(160, 55%, 55%)",   // mint green
    "hsl(40, 80%, 60%)",    // warm amber
    "hsl(270, 55%, 68%)",   // lavender
    "hsl(15, 75%, 65%)",    // coral
    "hsl(185, 60%, 55%)",   // teal
    "hsl(55, 70%, 58%)",    // golden yellow
]

function formatDateLabel(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    const dayName = date.toLocaleDateString("tr-TR", { weekday: "long", timeZone: "Europe/Istanbul" })
    const formattedDate = date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Istanbul",
    })
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${formattedDate}`
}

function formatShortDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        timeZone: "Europe/Istanbul",
    })
}

function isToday(dateStr: string): boolean {
    const now = new Date()
    const turkeyTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }))
    const today = `${turkeyTime.getFullYear()}-${String(turkeyTime.getMonth() + 1).padStart(2, '0')}-${String(turkeyTime.getDate()).padStart(2, '0')}`
    return dateStr === today
}

/**
 * Returns a status color based on how close calories are to the goal.
 * green = plenty of room, orange = approaching, red = exceeded
 */
function getGoalStatusColor(totalCalories: number, goal: number | null): string {
    if (!goal) return "hsl(217, 91%, 60%)" // default blue if no goal
    const ratio = totalCalories / goal
    if (ratio >= 1) return "hsl(0, 84%, 60%)"      // red — exceeded
    if (ratio >= 0.75) return "hsl(38, 92%, 50%)"   // orange — approaching
    return "hsl(142, 71%, 45%)"                      // green — under goal
}

function getGoalStatusLabel(totalCalories: number, goal: number | null): string {
    if (!goal) return ""
    const ratio = totalCalories / goal
    if (ratio >= 1) return "Hedef aşıldı"
    if (ratio >= 0.75) return "Hedefe yaklaşıyorsunuz"
    return "Hedefin altında"
}

function getGoalStatusBadgeClass(totalCalories: number, goal: number | null): string {
    if (!goal) return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    const ratio = totalCalories / goal
    if (ratio >= 1) return "bg-red-500/10 text-red-600 dark:text-red-400"
    if (ratio >= 0.75) return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
}

const CARDS_PER_PAGE_DESKTOP = 5
const CARDS_PER_PAGE_MOBILE = 4

export default function KaloriTakibiPage() {
    const isMobile = useMediaQuery("(max-width: 767px)")
    const { data: session, status } = useSession()
    const router = useRouter()
    const [logs, setLogs] = useState<DayLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [showGoalModal, setShowGoalModal] = useState(false)
    const [pageIndex, setPageIndex] = useState(0)
    const [isPageTransitioning, setIsPageTransitioning] = useState(false)
    const { calorieGoal, isLoading: goalLoading, setCalorieGoal, needsGoal } = useCalorieGoal()
    const [selectedMeal, setSelectedMeal] = useState<{ id: string; name: string; calories: number } | null>(null)

    useEffect(() => {
        if (session?.user) {
            fetchAllLogs()
        }
    }, [session?.user])

    const fetchAllLogs = async () => {
        try {
            setIsLoading(true)
            const res = await fetch("/api/daily-log/all")
            if (res.ok) {
                const data = await res.json()
                const fetchedLogs: DayLog[] = data.logs || []
                setLogs(fetchedLogs)
                // En son sayfadan başla (en yeni loglar görünsün)
                const sorted = [...fetchedLogs].sort((a, b) => a.date.localeCompare(b.date))
                const cpp = isMobile ? CARDS_PER_PAGE_MOBILE : CARDS_PER_PAGE_DESKTOP
                setPageIndex(Math.max(0, Math.ceil(sorted.length / cpp) - 1))
                // Auto-select today or most recent
                if (sorted.length > 0) {
                    const todayLog = sorted.find((l) => isToday(l.date))
                    setSelectedDate(todayLog ? todayLog.date : sorted[sorted.length - 1].date)
                }
            }
        } catch (error) {
            console.error("Failed to fetch daily logs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const selectedLog = useMemo(
        () => logs.find((l) => l.date === selectedDate) || null,
        [logs, selectedDate]
    )

    // Logları tarihe göre eskiden yeniye sırala (sol→sağ: eski→yeni)
    const sortedLogs = useMemo(
        () => [...logs].sort((a, b) => a.date.localeCompare(b.date)),
        [logs]
    )

    // Pagination for mini donut cards
    const cardsPerPage = isMobile ? CARDS_PER_PAGE_MOBILE : CARDS_PER_PAGE_DESKTOP
    const maxPage = Math.max(0, Math.ceil(sortedLogs.length / cardsPerPage) - 1)
    const currentPageLogs = useMemo(
        () => sortedLogs.slice(pageIndex * cardsPerPage, pageIndex * cardsPerPage + cardsPerPage),
        [sortedLogs, pageIndex, cardsPerPage]
    )

    const handlePageChange = useCallback((direction: 'prev' | 'next') => {
        setIsPageTransitioning(true)
        if (direction === 'prev') {
            setPageIndex(prev => Math.max(prev - 1, 0))
        } else {
            setPageIndex(prev => Math.min(prev + 1, maxPage))
        }
        // Short skeleton delay for smooth transition
        setTimeout(() => setIsPageTransitioning(false), 300)
    }, [maxPage])

    const handleRemoveMeal = async (date: string, mealName: string, calories: number, mealId: string) => {
        // Optimistic update
        setLogs(prev => prev.map(log => {
            if (log.date !== date) return log
            const updatedMeals = log.consumedMeals.filter(m => m.mealName !== mealName)
            return {
                ...log,
                consumedMeals: updatedMeals,
                totalCalories: Math.max(0, log.totalCalories - calories),
            }
        }).filter(log => log.consumedMeals.length > 0))

        try {
            const res = await fetch("/api/daily-log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, mealName, calories, mealId, action: "remove" }),
            })

            if (res.ok) {
                toast.success(`${mealName} günlükten çıkarıldı`, { duration: 2000 })
            } else {
                await fetchAllLogs()
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        } catch {
            await fetchAllLogs()
            toast.error("Bir hata oluştu", { duration: 2000 })
        }
    }

    const handleGoalSet = async (goal: number) => {
        const success = await setCalorieGoal(goal)
        if (success) {
            toast.success(`Kalori hedefi ${goal} kcal olarak belirlendi`, { duration: 2000 })
        } else {
            toast.error("Kalori hedefi kaydedilemedi", { duration: 2000 })
        }
    }

    // Build chart data for a given log
    const buildChartData = (log: DayLog) => {
        const meals = log.consumedMeals.map((meal, idx) => ({
            name: toTitleCase(meal.mealName),
            value: meal.calories,
            fill: MEAL_COLORS[idx % MEAL_COLORS.length],
        }))

        // If there is remaining goal space, add it as a light segment
        if (calorieGoal && log.totalCalories < calorieGoal) {
            meals.push({
                name: "Kalan",
                value: calorieGoal - log.totalCalories,
                fill: "hsl(0, 0%, 90%)",
            })
        }

        return meals
    }

    const buildChartConfig = (log: DayLog): ChartConfig => {
        const config: ChartConfig = {
            value: { label: "Kalori" },
        }
        log.consumedMeals.forEach((meal, idx) => {
            config[toTitleCase(meal.mealName)] = {
                label: toTitleCase(meal.mealName),
                color: MEAL_COLORS[idx % MEAL_COLORS.length],
            }
        })
        if (calorieGoal && log.totalCalories < calorieGoal) {
            config["Kalan"] = {
                label: "Kalan",
                color: "hsl(0, 0%, 90%)",
            }
        }
        return config
    }

    // Loading state
    if (status === "loading" || (status === "authenticated" && (isLoading || goalLoading))) {
        return (
            <main className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
                {/* Back button + Title */}
                <div className="flex items-center gap-3 mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => router.push("/")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-lg font-semibold text-foreground">
                        Kalori Takibi
                    </h1>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto h-7 text-xs px-3"
                        onClick={() => setShowGoalModal(true)}
                    >
                        {calorieGoal ? `Hedef: ${calorieGoal} kcal` : 'Hedef Belirle'}
                    </Button>
                </div>

                {/* Empty State */}
                {logs.length === 0 ? (
                    <Card className="border border-border/40 bg-card p-8 text-center">
                        <Flame className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Kalori takibi için henüz bir kayıt bulunamadı. Menüdeki ekle butonunu kullanarak kalori takibine başlayabilirsiniz.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => router.push("/")}
                        >
                            Menüye Dön
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {/* Mini Donut Charts — Fixed 5 Cards with Navigation */}
                        <div className="relative">
                            {/* Desktop: overlay oklar */}
                            <Button
                                variant="default"
                                size="sm"
                                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-foreground text-background hover:bg-foreground/90 rounded-full shadow-md disabled:bg-foreground/50"
                                disabled={pageIndex <= 0 || isPageTransitioning}
                                onClick={() => handlePageChange('prev')}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Kartlar */}
                            <div className="flex gap-1.5 md:gap-2 min-h-[90px] md:min-h-[130px] items-center md:px-0">
                                {isPageTransitioning ? (
                                    Array.from({ length: Math.min(cardsPerPage, sortedLogs.length - pageIndex * cardsPerPage) }).map((_, i) => (
                                        <MiniDonutSkeleton key={i} />
                                    ))
                                ) : (
                                    currentPageLogs.map((log) => (
                                        <MiniDonutCard
                                            key={log.date}
                                            log={log}
                                            calorieGoal={calorieGoal}
                                            isSelected={log.date === selectedDate}
                                            chartData={buildChartData(log)}
                                            chartConfig={buildChartConfig(log)}
                                            onClick={() => setSelectedDate(log.date)}
                                            isMobile={isMobile}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Desktop: overlay sağ ok */}
                            <Button
                                variant="default"
                                size="sm"
                                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-foreground text-background hover:bg-foreground/90 rounded-full shadow-md disabled:bg-foreground/50"
                                disabled={pageIndex >= maxPage || isPageTransitioning}
                                onClick={() => handlePageChange('next')}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Mobil: kartların altında önceki/sonraki butonları */}
                        {isMobile && sortedLogs.length > cardsPerPage && (
                            <div className="flex items-center justify-between -mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground gap-1 px-3 disabled:opacity-30"
                                    disabled={pageIndex <= 0 || isPageTransitioning}
                                    onClick={() => handlePageChange('prev')}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Önceki
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground gap-1 px-3 disabled:opacity-30"
                                    disabled={pageIndex >= maxPage || isPageTransitioning}
                                    onClick={() => handlePageChange('next')}
                                >
                                    Sonraki
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}

                        {/* Selected Day Details */}
                        {selectedLog && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                                {/* Big Donut Chart */}
                                <BigDonutCard
                                    log={selectedLog}
                                    calorieGoal={calorieGoal}
                                    chartData={buildChartData(selectedLog)}
                                    chartConfig={buildChartConfig(selectedLog)}
                                />

                                {/* Meal List */}
                                <Card className="border border-border/40 bg-card flex flex-col gap-0">
                                    <div className="px-4 pt-3 pb-1">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Yenilen Yemekler
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 flex-1">
                                        {selectedLog.consumedMeals.length === 0 ? (
                                            <p className="text-xs text-muted-foreground/60 py-4 text-center">
                                                Bu gün için kayıt yok.
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                {selectedLog.consumedMeals.map((meal, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/40 transition-colors px-1 -mx-1"
                                                        onClick={() => setSelectedMeal({ id: meal.mealId, name: meal.mealName, calories: meal.calories })}
                                                    >
                                                        <span
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: MEAL_COLORS[idx % MEAL_COLORS.length] }}
                                                        />
                                                        <span className="text-sm text-foreground truncate flex-1 min-w-0">
                                                            {toTitleCase(meal.mealName)}
                                                        </span>
                                                        <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-1.5 text-muted-foreground bg-secondary/50 shrink-0">
                                                            {meal.calories} kcal
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 w-5 p-0 text-muted-foreground/50 hover:text-primary shrink-0"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedMeal({ id: meal.mealId, name: meal.mealName, calories: meal.calories })
                                                            }}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 w-5 p-0 text-muted-foreground/50 hover:text-destructive shrink-0"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleRemoveMeal(selectedLog.date, meal.mealName, meal.calories, meal.mealId)
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedLog.consumedMeals.length > 0 && (
                                        <div className="border-t border-border/40 px-4 py-2.5 mt-auto flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Toplam Kalori</span>
                                            <Badge variant="secondary" className={`font-mono font-semibold text-[10px] h-5 px-2.5 ${getGoalStatusBadgeClass(selectedLog.totalCalories, calorieGoal)}`}>
                                                {selectedLog.totalCalories} kcal
                                            </Badge>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Meal Detail Modal */}
            {selectedMeal && (
                <MealDetailModal
                    mealId={selectedMeal.id}
                    mealName={selectedMeal.name}
                    mealCalories={selectedMeal.calories}
                    open={!!selectedMeal}
                    onOpenChange={(open) => {
                        if (!open) setSelectedMeal(null)
                    }}
                />
            )}

            {/* Calorie Goal Modal */}
            <CalorieGoalModal
                open={showGoalModal}
                onOpenChange={setShowGoalModal}
                currentGoal={calorieGoal}
                onGoalSet={handleGoalSet}
            />

        </main>
    )
}

// =============================================
// Mini Donut Card Component
// =============================================

interface MiniDonutCardProps {
    log: DayLog
    calorieGoal: number | null
    isSelected: boolean
    chartData: Array<{ name: string; value: number; fill: string }>
    chartConfig: ChartConfig
    onClick: () => void
    isMobile: boolean
}

function MiniDonutCard({ log, calorieGoal, isSelected, chartData, chartConfig, onClick, isMobile }: MiniDonutCardProps) {
    const statusColor = getGoalStatusColor(log.totalCalories, calorieGoal)
    const goalLabel = calorieGoal ? `${log.totalCalories}/${calorieGoal}` : `${log.totalCalories}`
    const dateLabel = isToday(log.date) ? "Bugün" : formatShortDate(log.date)

    return (
        <Card
            className={`border cursor-pointer transition-all flex-1 min-w-0 ${isSelected
                ? "border-primary/50 bg-card shadow-md ring-1 ring-primary/20"
                : "border-border/40 bg-card hover:border-border/60 hover:shadow-sm"
                }`}
            onClick={onClick}
        >
            <CardContent className={`flex flex-col items-center ${isMobile ? 'p-1.5 gap-0' : 'p-3 gap-1'}`}>
                <ChartContainer
                    config={chartConfig}
                    className={`mx-auto aspect-square ${isMobile ? 'w-[56px] h-[56px]' : 'w-[80px] h-[80px]'}`}
                >
                    <PieChart>
                        {!isMobile && (
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                        )}
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={isMobile ? 15 : 22}
                            outerRadius={isMobile ? 25 : 36}
                            strokeWidth={isMobile ? 1.5 : 2}
                            stroke="hsl(var(--background))"
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className={`fill-foreground font-bold ${isMobile ? 'text-[7px]' : 'text-[10px]'}`}
                                                >
                                                    {log.totalCalories}
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
                {/* Mobil: sadece tarih, Desktop: tarih + kcal */}
                {isMobile ? (
                    <p className="text-[9px] text-muted-foreground text-center leading-tight mt-0.5">
                        {dateLabel}
                    </p>
                ) : (
                    <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">
                            {dateLabel}
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: statusColor }}>
                            {goalLabel} kcal
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// =============================================
// Big Donut Card Component
// =============================================

interface BigDonutCardProps {
    log: DayLog
    calorieGoal: number | null
    chartData: Array<{ name: string; value: number; fill: string }>
    chartConfig: ChartConfig
}

function BigDonutCard({ log, calorieGoal, chartData, chartConfig }: BigDonutCardProps) {
    const statusColor = getGoalStatusColor(log.totalCalories, calorieGoal)
    const statusLabel = getGoalStatusLabel(log.totalCalories, calorieGoal)
    const badgeClass = getGoalStatusBadgeClass(log.totalCalories, calorieGoal)

    return (
        <Card className="border border-border/40 bg-card flex flex-col gap-0">
            <CardContent className="p-3 flex-1 flex flex-col items-center justify-center">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[200px] w-full"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={95}
                            strokeWidth={3}
                            stroke="hsl(var(--background))"
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - 8}
                                                    className="fill-foreground text-2xl font-bold"
                                                >
                                                    {log.totalCalories}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 14}
                                                    className="fill-muted-foreground text-xs"
                                                >
                                                    {calorieGoal ? `/ ${calorieGoal} kcal` : "kcal"}
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="border-t border-border/40 px-4 !pt-2.5 pb-2.5 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                        {isToday(log.date) ? "Bugün" : formatDateLabel(log.date)}
                    </p>
                    {isToday(log.date) && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-primary/10 text-primary">
                            Bugün
                        </Badge>
                    )}
                </div>
                {statusLabel && (
                    <Badge variant="secondary" className={`text-[10px] h-5 px-2 ${badgeClass}`}>
                        {statusLabel}
                    </Badge>
                )}
            </CardFooter>
        </Card>
    )
}

// =============================================
// Mini Donut Skeleton Component
// =============================================

function MiniDonutSkeleton() {
    return (
        <Card className="border border-border/40 bg-card flex-1 min-w-0">
            <CardContent className="p-1.5 md:p-3 flex flex-col items-center gap-1 md:gap-2">
                <Skeleton className="w-[56px] h-[56px] md:w-[80px] md:h-[80px] rounded-full" />
                <div className="hidden md:flex flex-col items-center gap-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </CardContent>
        </Card>
    )
}
