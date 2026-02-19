"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Flame, ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { toTitleCase } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { InfoDialog } from "@/components/info-dialog"
import { AuthButton } from "@/components/auth-button"

interface ConsumedMeal {
    mealName: string
    calories: number
}

interface DayLog {
    date: string
    totalCalories: number
    consumedMeals: ConsumedMeal[]
}

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

function isToday(dateStr: string): boolean {
    const now = new Date()
    const turkeyTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }))
    const today = `${turkeyTime.getFullYear()}-${String(turkeyTime.getMonth() + 1).padStart(2, '0')}-${String(turkeyTime.getDate()).padStart(2, '0')}`
    return dateStr === today
}

function getCalorieColor(totalCalories: number): string {
    if (totalCalories < 800) return "text-emerald-500"
    if (totalCalories < 1100) return "text-amber-500"
    return "text-red-500"
}

function getCalorieDot(totalCalories: number): string {
    if (totalCalories < 800) return "bg-emerald-500"
    if (totalCalories < 1100) return "bg-amber-500"
    return "bg-red-500"
}

export default function KaloriTakibiPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [logs, setLogs] = useState<DayLog[]>([])
    const [isLoading, setIsLoading] = useState(true)

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
                setLogs(data.logs || [])
            }
        } catch (error) {
            console.error("Failed to fetch daily logs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveMeal = async (date: string, mealName: string, calories: number) => {
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
                body: JSON.stringify({ date, mealName, calories, action: "remove" }),
            })

            if (res.ok) {
                toast.success(`${mealName} günlükten çıkarıldı`, { duration: 2000 })
            } else {
                // Rollback by re-fetching
                await fetchAllLogs()
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        } catch {
            await fetchAllLogs()
            toast.error("Bir hata oluştu", { duration: 2000 })
        }
    }

    if (status === "loading" || (status === "authenticated" && isLoading)) {
        return (
            <main className="min-h-screen bg-background">
                <header className="dark text-foreground sticky top-0 z-50 border-b border-border bg-background">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="relative h-9 w-40 md:w-48">
                                <Image src="/logo-cu.png" alt="ÇÜ Yemekhane" fill className="object-contain object-left" priority />
                            </div>
                            <div className="flex items-center gap-2">
                                <InfoDialog />
                                <AuthButton />
                                <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </header>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </main >
        )
    }

    // Calculate grand total
    const grandTotalCalories = logs.reduce((sum, log) => sum + log.totalCalories, 0)
    const totalMeals = logs.reduce((sum, log) => sum + log.consumedMeals.length, 0)

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <header className="dark text-foreground sticky top-0 z-50 border-b border-border bg-background">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="relative h-9 w-40 md:w-48">
                            <Image src="/logo-cu.png" alt="ÇÜ Yemekhane" fill className="object-contain object-left" priority />
                        </div>
                        <div className="flex items-center gap-2">
                            <InfoDialog />
                            <AuthButton />
                            <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 md:py-8 max-w-md">
                {/* Back button + Title */}
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => router.push("/")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">
                            Kalori Takibi
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {logs.length} gün · {totalMeals} yemek · {grandTotalCalories} kcal
                        </p>
                    </div>
                </div>

                {/* Daily Logs */}
                {logs.length === 0 ? (
                    <Card className="border border-border/40 bg-card p-8 text-center">
                        <Flame className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Henüz kalori kaydınız yok.
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Menüdeki yemeklerin yanındaki üç nokta menüsünden &quot;Bunu Yedim&quot; seçeneğiyle kayıt ekleyebilirsiniz.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 text-xs"
                            onClick={() => router.push("/")}
                        >
                            Menüye Dön
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <Card key={log.date} className="border border-border/40 bg-card overflow-hidden">
                                {/* Day Header */}
                                <div className="bg-muted/20 px-3 py-2 border-b border-border/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground">
                                            {formatDateLabel(log.date)}
                                        </span>
                                        {isToday(log.date) && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-primary/10 text-primary">
                                                Bugün
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Meals */}
                                <div className="divide-y divide-border/40">
                                    {log.consumedMeals.map((meal, idx) => (
                                        <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-muted/20 transition-colors">
                                            <span className="text-sm text-foreground truncate min-w-0">{toTitleCase(meal.mealName)}</span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-2 text-muted-foreground bg-secondary/50">
                                                    {meal.calories} kcal
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive"
                                                    onClick={() => handleRemoveMeal(log.date, meal.mealName, meal.calories)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Day Total */}
                                <div className="bg-muted/20 px-3 py-2 border-t border-border/40 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <span className={`inline-block w-2 h-2 rounded-full ${getCalorieDot(log.totalCalories)}`} />
                                        Toplam
                                    </span>
                                    <span className={`text-xs font-mono font-semibold ${getCalorieColor(log.totalCalories)}`}>
                                        {log.totalCalories} kcal
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
