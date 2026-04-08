"use client"

import { useState, useCallback } from "react"

interface Notification {
    id: number
    type: "mention" | "reaction" | "reply"
    read: boolean
    createdAt: string
    commentId: number | null
    actorName: string | null
    actorImage: string | null
    commentContent: string | null
    menuDate: string | null
}

export function useNotifications(authenticated: boolean) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)

    const fetchNotifications = useCallback(async () => {
        if (!authenticated) return
        setLoading(true)
        try {
            const res = await fetch("/api/notifications?limit=50")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications ?? [])
                setUnreadCount(data.unreadCount ?? 0)
            }
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [authenticated])

    const markAsRead = useCallback(async (notificationIds: number[]) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds }),
            })
            setNotifications((prev) =>
                prev.map((n) =>
                    notificationIds.includes(n.id) ? { ...n, read: true } : n
                )
            )
            setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
        } catch {
            // silent
        }
    }, [])

    const markAllAsRead = useCallback(async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            })
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch {
            // silent
        }
    }, [])

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    }
}
