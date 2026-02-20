"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export function useFavorites() {
    const { data: session } = useSession()
    const [favorites, setFavorites] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchFavorites = useCallback(async () => {
        if (!session?.user) return
        try {
            const res = await fetch("/api/favorites")
            if (res.ok) {
                const data = await res.json()
                // API now returns array of { mealName, mealId } objects
                const favs = data.favorites || []
                setFavorites(favs.map((f: { mealName: string }) => f.mealName))
            }
        } catch (error) {
            console.error("Failed to fetch favorites:", error)
        }
    }, [session?.user])

    useEffect(() => {
        fetchFavorites()
    }, [fetchFavorites])

    const toggleFavorite = useCallback(
        async (mealName: string, mealId?: string) => {
            if (!session?.user) return false

            // Optimistic update
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
                    // Rollback on error
                    setFavorites((prev) =>
                        wasFavorited
                            ? [...prev, mealName]
                            : prev.filter((f) => f !== mealName)
                    )
                    return false
                }

                return true
            } catch {
                // Rollback on error
                setFavorites((prev) =>
                    wasFavorited
                        ? [...prev, mealName]
                        : prev.filter((f) => f !== mealName)
                )
                return false
            }
        },
        [session?.user, favorites]
    )

    const isFavorited = useCallback(
        (mealName: string) => favorites.includes(mealName),
        [favorites]
    )

    return { favorites, isLoading, toggleFavorite, isFavorited }
}
