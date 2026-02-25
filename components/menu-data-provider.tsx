"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import { AUTH_ENABLED } from "@/lib/feature-flags"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConsumedMeal {
    mealName: string
    calories: number
    mealId: string
}

interface DailyLogData {
    totalCalories: number
    consumedMeals: ConsumedMeal[]
}

interface MenuDataContextType {
    // Session
    session: ReturnType<typeof useSession>["data"] | null
    status: ReturnType<typeof useSession>["status"] | "unauthenticated"
    isAuthenticated: boolean

    // Favorites (shared across all MenuCards)
    favorites: string[]
    isFavorited: (mealName: string) => boolean
    toggleFavorite: (mealName: string, mealId?: string) => Promise<boolean>

    // Calorie Goal (shared across all MenuCards)
    calorieGoal: number | null
    calorieGoalLoading: boolean
    needsGoal: boolean
    setCalorieGoal: (goal: number) => Promise<boolean>

    // Daily Logs (per-date, fetched on demand)
    getDailyLog: (date: string) => DailyLogData
    addMeal: (date: string, mealName: string, calories: number, mealId: string) => Promise<boolean>
    removeMeal: (date: string, mealName: string) => Promise<boolean>
    isConsumed: (date: string, mealName: string) => boolean
}

const MenuDataContext = createContext<MenuDataContextType | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function MenuDataProvider({ children }: { children: ReactNode }) {
    // Auth kapalıysa useSession çağırma — SessionProvider olmayacak
    if (!AUTH_ENABLED) {
        return <MenuDataProviderDisabled>{children}</MenuDataProviderDisabled>
    }
    return <MenuDataProviderEnabled>{children}</MenuDataProviderEnabled>
}

// ─── Auth Kapalı Provider ────────────────────────────────────────────────────

function MenuDataProviderDisabled({ children }: { children: ReactNode }) {
    const emptyDailyLog: DailyLogData = { totalCalories: 0, consumedMeals: [] }

    return (
        <MenuDataContext.Provider
            value={{
                session: null,
                status: "unauthenticated",
                isAuthenticated: false,
                favorites: [],
                isFavorited: () => false,
                toggleFavorite: async () => false,
                calorieGoal: null,
                calorieGoalLoading: false,
                needsGoal: false,
                setCalorieGoal: async () => false,
                getDailyLog: () => emptyDailyLog,
                addMeal: async () => false,
                removeMeal: async () => false,
                isConsumed: () => false,
            }}
        >
            {children}
        </MenuDataContext.Provider>
    )
}

// ─── Auth Açık Provider ──────────────────────────────────────────────────────

function MenuDataProviderEnabled({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession()
    const isAuthenticated = status === "authenticated"

    // ── Favorites ──────────────────────────────────────────────────────────
    const [favorites, setFavorites] = useState<string[]>([])

    useEffect(() => {
        if (!isAuthenticated) {
            setFavorites([])
            return
        }
        const fetchFavorites = async () => {
            try {
                const res = await fetch("/api/favorites")
                if (res.ok) {
                    const data = await res.json()
                    const favs = data.favorites || []
                    setFavorites(favs.map((f: { mealName: string }) => f.mealName))
                }
            } catch (error) {
                console.error("Failed to fetch favorites:", error)
            }
        }
        fetchFavorites()
    }, [isAuthenticated])

    const isFavorited = useCallback(
        (mealName: string) => favorites.includes(mealName),
        [favorites]
    )

    const toggleFavorite = useCallback(
        async (mealName: string, mealId?: string) => {
            if (!isAuthenticated) return false

            const wasFavorited = favorites.includes(mealName)
            setFavorites((prev) =>
                wasFavorited
                    ? prev.filter((f) => f !== mealName)
                    : [...prev, mealName]
            )

            try {
                const res = await fetch("/api/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mealName, mealId }),
                })

                if (!res.ok) {
                    setFavorites((prev) =>
                        wasFavorited
                            ? [...prev, mealName]
                            : prev.filter((f) => f !== mealName)
                    )
                    return false
                }
                return true
            } catch {
                setFavorites((prev) =>
                    wasFavorited
                        ? [...prev, mealName]
                        : prev.filter((f) => f !== mealName)
                )
                return false
            }
        },
        [isAuthenticated, favorites]
    )

    // ── Calorie Goal ───────────────────────────────────────────────────────
    const [calorieGoal, setCalorieGoalState] = useState<number | null>(null)
    const [calorieGoalLoading, setCalorieGoalLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) {
            setCalorieGoalState(null)
            setCalorieGoalLoading(false)
            return
        }
        const fetchGoal = async () => {
            try {
                setCalorieGoalLoading(true)
                const res = await fetch("/api/calorie-goal")
                if (res.ok) {
                    const data = await res.json()
                    setCalorieGoalState(data.calorieGoal)
                }
            } catch (error) {
                console.error("Failed to fetch calorie goal:", error)
            } finally {
                setCalorieGoalLoading(false)
            }
        }
        fetchGoal()
    }, [isAuthenticated])

    const needsGoal = !calorieGoalLoading && calorieGoal === null

    const setCalorieGoal = useCallback(
        async (goal: number): Promise<boolean> => {
            if (!isAuthenticated) return false

            const previousGoal = calorieGoal
            setCalorieGoalState(goal)

            try {
                const res = await fetch("/api/calorie-goal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ calorieGoal: goal }),
                })
                if (!res.ok) {
                    setCalorieGoalState(previousGoal)
                    return false
                }
                return true
            } catch {
                setCalorieGoalState(previousGoal)
                return false
            }
        },
        [isAuthenticated, calorieGoal]
    )

    // ── Daily Logs (per-date) ──────────────────────────────────────────────
    const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLogData>>({})
    const [fetchedDates, setFetchedDates] = useState<Set<string>>(new Set())

    const fetchDailyLog = useCallback(
        async (date: string) => {
            if (!isAuthenticated || !date || fetchedDates.has(date)) return

            setFetchedDates((prev) => new Set(prev).add(date))
            try {
                const res = await fetch(`/api/daily-log?date=${date}`)
                if (res.ok) {
                    const data = await res.json()
                    setDailyLogs((prev) => ({
                        ...prev,
                        [date]: {
                            totalCalories: data.totalCalories || 0,
                            consumedMeals: data.consumedMeals || [],
                        },
                    }))
                }
            } catch (error) {
                console.error("Failed to fetch daily log:", error)
            }
        },
        [isAuthenticated, fetchedDates]
    )

    const getDailyLog = useCallback(
        (date: string): DailyLogData => {
            // Trigger fetch if not yet fetched
            if (isAuthenticated && !fetchedDates.has(date)) {
                fetchDailyLog(date)
            }
            return dailyLogs[date] || { totalCalories: 0, consumedMeals: [] }
        },
        [isAuthenticated, dailyLogs, fetchedDates, fetchDailyLog]
    )

    const addMeal = useCallback(
        async (date: string, mealName: string, calories: number, mealId: string) => {
            if (!isAuthenticated) return false

            const current = dailyLogs[date] || { totalCalories: 0, consumedMeals: [] }

            // Optimistic update
            setDailyLogs((prev) => ({
                ...prev,
                [date]: {
                    totalCalories: current.totalCalories + calories,
                    consumedMeals: [...current.consumedMeals, { mealName, calories, mealId }],
                },
            }))

            try {
                const res = await fetch("/api/daily-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ date, mealName, calories, mealId, action: "add" }),
                })

                if (res.status === 409) {
                    // Meal already exists in DB — keep optimistic state, it's just a sync issue
                    return true
                }

                if (!res.ok) {
                    // Rollback
                    setDailyLogs((prev) => ({ ...prev, [date]: current }))
                    return false
                }
                return true
            } catch {
                setDailyLogs((prev) => ({ ...prev, [date]: current }))
                return false
            }
        },
        [isAuthenticated, dailyLogs]
    )

    const removeMeal = useCallback(
        async (date: string, mealName: string) => {
            if (!isAuthenticated) return false

            const current = dailyLogs[date] || { totalCalories: 0, consumedMeals: [] }
            const meal = current.consumedMeals.find((m) => m.mealName === mealName)
            if (!meal) return false

            // Optimistic update
            setDailyLogs((prev) => ({
                ...prev,
                [date]: {
                    totalCalories: Math.max(0, current.totalCalories - meal.calories),
                    consumedMeals: current.consumedMeals.filter((m) => m.mealName !== mealName),
                },
            }))

            try {
                const res = await fetch("/api/daily-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        date,
                        mealName,
                        calories: meal.calories,
                        action: "remove",
                    }),
                })

                if (!res.ok) {
                    setDailyLogs((prev) => ({ ...prev, [date]: current }))
                    return false
                }
                return true
            } catch {
                setDailyLogs((prev) => ({ ...prev, [date]: current }))
                return false
            }
        },
        [isAuthenticated, dailyLogs]
    )

    const isConsumed = useCallback(
        (date: string, mealName: string) => {
            const log = dailyLogs[date]
            return log ? log.consumedMeals.some((m) => m.mealName === mealName) : false
        },
        [dailyLogs]
    )

    return (
        <MenuDataContext.Provider
            value={{
                session,
                status,
                isAuthenticated,
                favorites,
                isFavorited,
                toggleFavorite,
                calorieGoal,
                calorieGoalLoading,
                needsGoal,
                setCalorieGoal,
                getDailyLog,
                addMeal,
                removeMeal,
                isConsumed,
            }}
        >
            {children}
        </MenuDataContext.Provider>
    )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMenuData() {
    const context = useContext(MenuDataContext)
    if (!context) {
        throw new Error("useMenuData must be used within a MenuDataProvider")
    }
    return context
}
