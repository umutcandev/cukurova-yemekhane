"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export function useCalorieGoal() {
    const { data: session } = useSession()
    const [calorieGoal, setCalorieGoalState] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchGoal = useCallback(async () => {
        if (!session?.user) {
            setIsLoading(false)
            return
        }
        try {
            setIsLoading(true)
            const res = await fetch("/api/calorie-goal")
            if (res.ok) {
                const data = await res.json()
                setCalorieGoalState(data.calorieGoal)
            }
        } catch (error) {
            console.error("Failed to fetch calorie goal:", error)
        } finally {
            setIsLoading(false)
        }
    }, [session?.user])

    useEffect(() => {
        fetchGoal()
    }, [fetchGoal])

    const setCalorieGoal = useCallback(
        async (goal: number): Promise<boolean> => {
            if (!session?.user) return false

            // Optimistic update
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
        [session?.user, calorieGoal]
    )

    return {
        calorieGoal,
        isLoading,
        setCalorieGoal,
        needsGoal: !isLoading && calorieGoal === null,
    }
}
