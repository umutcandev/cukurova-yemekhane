"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Custom Like icon (Geist)
function LikeIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M6.89531 2.23972C6.72984 2.12153 6.5 2.23981 6.5 2.44315V5.25001C6.5 6.21651 5.7165 7.00001 4.75 7.00001H2.5V13.5H12.1884C12.762 13.5 13.262 13.1096 13.4011 12.5532L14.4011 8.55318C14.5984 7.76425 14.0017 7.00001 13.1884 7.00001H9.25H8.5V6.25001V3.51458C8.5 3.43384 8.46101 3.35807 8.39531 3.31114L6.89531 2.23972ZM5 2.44315C5 1.01975 6.6089 0.191779 7.76717 1.01912L9.26717 2.09054C9.72706 2.41904 10 2.94941 10 3.51458V5.50001H13.1884C14.9775 5.50001 16.2903 7.18133 15.8563 8.91698L14.8563 12.917C14.5503 14.1412 13.4503 15 12.1884 15H1.75H1V14.25V6.25001V5.50001H1.75H4.75C4.88807 5.50001 5 5.38808 5 5.25001V2.44315Z" />
        </svg>
    )
}

// Custom Dislike icon (Geist)
function DislikeIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M6.89531 13.7603C6.72984 13.8785 6.5 13.7602 6.5 13.5569V10.75C6.5 9.7835 5.7165 9 4.75 9H2.5V2.5H12.1884C12.762 2.5 13.262 2.89037 13.4011 3.44683L14.4011 7.44683C14.5984 8.23576 14.0017 9 13.1884 9H9.25H8.5V9.75V12.4854C8.5 12.5662 8.46101 12.6419 8.39531 12.6889L6.89531 13.7603ZM5 13.5569C5 14.9803 6.6089 15.8082 7.76717 14.9809L9.26717 13.9095C9.72706 13.581 10 13.0506 10 12.4854V10.5H13.1884C14.9775 10.5 16.2903 8.81868 15.8563 7.08303L14.8563 3.08303C14.5503 1.85882 13.4503 1 12.1884 1H1.75H1V1.75V9.75V10.5H1.75H4.75C4.88807 10.5 5 10.6119 5 10.75V13.5569Z" />
        </svg>
    )
}

// Animated counter component - only shows when value > 0
function AnimatedCounter({ value }: { value: number }) {
    return (
        <AnimatePresence>
            {value > 0 && (
                <motion.span
                    key={value}
                    initial={{ opacity: 0, scale: 0.5, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: "auto" }}
                    exit={{ opacity: 0, scale: 0.5, width: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="font-mono text-[10px] text-center inline-block overflow-hidden"
                >
                    {value}
                </motion.span>
            )}
        </AnimatePresence>
    )
}

interface LikeDislikeButtonsProps {
    menuDate: string // "2025-12-30" format
}

type UserAction = "like" | "dislike" | null

export function LikeDislikeButtons({ menuDate }: LikeDislikeButtonsProps) {
    const [likeCount, setLikeCount] = useState<number | null>(null)
    const [dislikeCount, setDislikeCount] = useState<number | null>(null)
    const [userAction, setUserAction] = useState<UserAction>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [lastClickTime, setLastClickTime] = useState(0)

    const DEBOUNCE_MS = 300

    // Load initial counts and user action from localStorage
    useEffect(() => {
        // Reset state immediately when menuDate changes to prevent stale state
        setUserAction(null)
        setLikeCount(null)
        setDislikeCount(null)
        setIsLoading(false)

        // Load user action from localStorage for this specific date
        const storedAction = localStorage.getItem(`reaction_${menuDate}`)
        if (storedAction === "like" || storedAction === "dislike") {
            setUserAction(storedAction)
        }

        // Fetch counts from API
        const fetchCounts = async () => {
            try {
                const res = await fetch(`/api/reactions?date=${menuDate}`)
                if (res.ok) {
                    const data = await res.json()
                    setLikeCount(data.likeCount)
                    setDislikeCount(data.dislikeCount)
                }
            } catch (error) {
                console.error("Failed to fetch reaction counts:", error)
                setLikeCount(0)
                setDislikeCount(0)
            }
        }

        fetchCounts()
    }, [menuDate])

    const handleReaction = useCallback(async (action: "like" | "dislike") => {
        // Debounce protection
        const now = Date.now()
        if (now - lastClickTime < DEBOUNCE_MS) return
        setLastClickTime(now)

        if (isLoading) return
        setIsLoading(true)

        const previousAction = userAction
        const previousLikeCount = likeCount
        const previousDislikeCount = dislikeCount

        // Determine what actions to send
        let apiActions: string[] = []
        let newUserAction: UserAction = null
        let optimisticLike = likeCount ?? 0
        let optimisticDislike = dislikeCount ?? 0

        if (previousAction === action) {
            // Toggle off - remove the reaction
            apiActions = [action === "like" ? "removeLike" : "removeDislike"]
            newUserAction = null
            if (action === "like") optimisticLike = Math.max(0, optimisticLike - 1)
            else optimisticDislike = Math.max(0, optimisticDislike - 1)
        } else if (previousAction === null) {
            // New reaction
            apiActions = [action]
            newUserAction = action
            if (action === "like") optimisticLike += 1
            else optimisticDislike += 1
        } else {
            // Switching from one to another
            apiActions = [
                previousAction === "like" ? "removeLike" : "removeDislike",
                action
            ]
            newUserAction = action
            if (previousAction === "like") {
                optimisticLike = Math.max(0, optimisticLike - 1)
                optimisticDislike += 1
            } else {
                optimisticDislike = Math.max(0, optimisticDislike - 1)
                optimisticLike += 1
            }
        }

        // Optimistic update - instant feedback
        setUserAction(newUserAction)
        setLikeCount(optimisticLike)
        setDislikeCount(optimisticDislike)

        // Save to localStorage immediately for instant feedback
        if (newUserAction) {
            localStorage.setItem(`reaction_${menuDate}`, newUserAction)
        } else {
            localStorage.removeItem(`reaction_${menuDate}`)
        }

        try {
            // Execute all API actions sequentially (in background)
            let finalData = { likeCount: optimisticLike, dislikeCount: optimisticDislike }

            for (const apiAction of apiActions) {
                const res = await fetch("/api/reactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ menuDate, action: apiAction })
                })

                if (res.status === 429) {
                    // Rate limited - show toast
                    const errorData = await res.json()
                    const resetInSeconds = Math.ceil((errorData.resetIn || 60000) / 1000)
                    toast.error(`Çok fazla istek! ${resetInSeconds} saniye bekleyin.`)
                    throw new Error("Rate limited")
                }

                if (res.ok) {
                    finalData = await res.json()
                }
            }

            // Silently sync with server data (usually same as optimistic)
            setLikeCount(finalData.likeCount)
            setDislikeCount(finalData.dislikeCount)
        } catch (error) {
            // Revert on error
            console.error("Failed to update reaction:", error)
            setUserAction(previousAction)
            setLikeCount(previousLikeCount)
            setDislikeCount(previousDislikeCount)
            // Revert localStorage
            if (previousAction) {
                localStorage.setItem(`reaction_${menuDate}`, previousAction)
            } else {
                localStorage.removeItem(`reaction_${menuDate}`)
            }
        } finally {
            setIsLoading(false)
        }
    }, [menuDate, userAction, likeCount, dislikeCount, isLoading, lastClickTime])

    return (
        <div className="flex items-center gap-1">
            {/* Like Button */}
            <motion.button
                onClick={() => handleReaction("like")}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "flex items-center gap-1 h-6 px-1.5 rounded-md text-xs transition-colors",
                    "border border-border/40 hover:border-border",
                    userAction === "like"
                        ? "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
                aria-label="Beğen"
            >
                <LikeIcon className="h-3.5 w-3.5" />
                <AnimatedCounter value={likeCount ?? 0} />
            </motion.button>

            {/* Dislike Button */}
            <motion.button
                onClick={() => handleReaction("dislike")}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "flex items-center gap-1 h-6 px-1.5 rounded-md text-xs transition-colors",
                    "border border-border/40 hover:border-border",
                    userAction === "dislike"
                        ? "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
                aria-label="Beğenme"
            >
                <DislikeIcon className="h-3.5 w-3.5" />
                <AnimatedCounter value={dislikeCount ?? 0} />
            </motion.button>
        </div>
    )
}
