"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface ConsumedMeal {
    mealName: string
    calories: number
    mealId: string
}

export function useDailyLog(date: string) {
    const { data: session } = useSession()
    const [totalCalories, setTotalCalories] = useState(0)
    const [consumedMeals, setConsumedMeals] = useState<ConsumedMeal[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchLog = useCallback(async () => {
        if (!session?.user || !date) return
        try {
            setIsLoading(true)
            const res = await fetch(`/api/daily-log?date=${date}`)
            if (res.ok) {
                const data = await res.json()
                setTotalCalories(data.totalCalories || 0)
                setConsumedMeals(data.consumedMeals || [])
            }
        } catch (error) {
            console.error("Failed to fetch daily log:", error)
        } finally {
            setIsLoading(false)
        }
    }, [session?.user, date])

    useEffect(() => {
        fetchLog()
    }, [fetchLog])

    const addMeal = useCallback(
        async (mealName: string, calories: number, mealId: string) => {
            if (!session?.user) return false

            // Optimistic update
            setConsumedMeals((prev) => [...prev, { mealName, calories, mealId }])
            setTotalCalories((prev) => prev + calories)

            try {
                const res = await fetch("/api/daily-log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ date, mealName, calories, mealId, action: "add" }),
                })

                if (!res.ok) {
                    // Rollback
                    setConsumedMeals((prev) =>
                        prev.filter((m) => m.mealName !== mealName)
                    )
                    setTotalCalories((prev) => prev - calories)
                    return false
                }

                return true
            } catch {
                // Rollback
                setConsumedMeals((prev) =>
                    prev.filter((m) => m.mealName !== mealName)
                )
                setTotalCalories((prev) => prev - calories)
                return false
            }
        },
        [session?.user, date]
    )

    const removeMeal = useCallback(
        async (mealName: string) => {
            if (!session?.user) return false

            const meal = consumedMeals.find((m) => m.mealName === mealName)
            if (!meal) return false

            // Optimistic update
            setConsumedMeals((prev) =>
                prev.filter((m) => m.mealName !== mealName)
            )
            setTotalCalories((prev) => Math.max(0, prev - meal.calories))

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
                    // Rollback
                    setConsumedMeals((prev) => [...prev, meal])
                    setTotalCalories((prev) => prev + meal.calories)
                    return false
                }

                return true
            } catch {
                // Rollback
                setConsumedMeals((prev) => [...prev, meal])
                setTotalCalories((prev) => prev + meal.calories)
                return false
            }
        },
        [session?.user, date, consumedMeals]
    )

    const isConsumed = useCallback(
        (mealName: string) => consumedMeals.some((m) => m.mealName === mealName),
        [consumedMeals]
    )

    return {
        totalCalories,
        consumedMeals,
        isLoading,
        addMeal,
        removeMeal,
        isConsumed,
    }
}
