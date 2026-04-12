"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatRelativeTime, getInitials } from "@/components/comments/utils"
import { cn } from "@/lib/utils"

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

interface NotificationPanelProps {
    notifications: Notification[]
    loading: boolean
    unreadCount: number
    onFetch: () => void
    onMarkAsRead: (ids: number[]) => void
    onMarkAllAsRead: () => void
    onClose?: () => void
}

function getNotificationText(type: "mention" | "reaction" | "reply"): string {
    switch (type) {
        case "mention":
            return "sizden bahsetti"
        case "reaction":
            return "yorumunuza tepki bıraktı"
        case "reply":
            return "yorumunuza yanıt verdi"
    }
}

type Tab = "all" | "read"

export function NotificationPanel({
    notifications,
    loading,
    unreadCount,
    onFetch,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose,
}: NotificationPanelProps) {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>("all")
    const [page, setPage] = useState(0)
    const PAGE_SIZE = 5

    const tabsRef = useRef<HTMLDivElement>(null)
    const allTabRef = useRef<HTMLButtonElement>(null)
    const readTabRef = useRef<HTMLButtonElement>(null)
    const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

    useLayoutEffect(() => {
        const activeEl = tab === "all" ? allTabRef.current : readTabRef.current
        const container = tabsRef.current
        if (!container || !activeEl) return
        const containerRect = container.getBoundingClientRect()
        const activeRect = activeEl.getBoundingClientRect()
        setIndicator({
            left: activeRect.left - containerRect.left,
            width: activeRect.width,
        })
    }, [tab, notifications.length])

    useEffect(() => {
        onFetch()
    }, [onFetch])

    // Tab değişince sayfayı sıfırla
    useEffect(() => {
        setPage(0)
    }, [tab])

    const filtered = tab === "read"
        ? notifications.filter((n) => n.read)
        : notifications

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.read) {
            onMarkAsRead([notif.id])
        }
        if (notif.menuDate) {
            onClose?.()
            router.push(`/?date=${notif.menuDate}&openComments=1`)
        }
    }

    return (
        <div className="w-[300px] sm:w-[340px] max-h-[400px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2">
                <h2 className="text-sm font-semibold text-foreground">Bildirimler</h2>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                        Tümünü okundu işaretle
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div ref={tabsRef} className="relative flex items-center gap-4 px-3 pt-1 border-b border-border/40">
                <button
                    ref={allTabRef}
                    onClick={() => setTab("all")}
                    className={cn(
                        "flex items-center gap-1.5 pb-2 text-[12px] font-medium transition-colors",
                        tab === "all"
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Tümü
                    {notifications.length > 0 && (
                        <span className={cn(
                            "inline-flex items-center justify-center min-w-[18px] h-[18px] px-2 rounded-sm text-[10px] font-semibold",
                            tab === "all"
                                ? "bg-foreground text-background"
                                : "bg-muted text-muted-foreground"
                        )}>
                            {notifications.length}
                        </span>
                    )}
                </button>
                <button
                    ref={readTabRef}
                    onClick={() => setTab("read")}
                    className={cn(
                        "pb-2 text-[12px] font-medium transition-colors",
                        tab === "read"
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Okunmuş
                </button>
                {indicator && (
                    <motion.div
                        className="absolute bottom-0 h-[2px] bg-foreground rounded-full"
                        initial={false}
                        animate={{ left: indicator.left, width: indicator.width }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                )}
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground/30 border-t-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <p className="text-xs">
                            {tab === "read" ? "Okunmuş bildiriminiz yok." : "Henüz bildiriminiz yok."}
                        </p>
                    </div>
                ) : (
                    <div>
                        {paginated.map((notif) => (
                            <button
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={cn(
                                    "w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/50",
                                    !notif.read && "bg-primary/5"
                                )}
                            >
                                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                    {notif.actorImage && (
                                        <AvatarImage
                                            src={notif.actorImage}
                                            alt={notif.actorName || ""}
                                        />
                                    )}
                                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                        {getInitials(notif.actorName)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <p className="text-xs leading-snug">
                                        <span className="font-semibold text-foreground">
                                            {notif.actorName || "Anonim"}
                                        </span>{" "}
                                        <span className="text-muted-foreground">
                                            {getNotificationText(notif.type)}
                                        </span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                                        {formatRelativeTime(notif.createdAt)}
                                    </p>
                                </div>

                                {!notif.read && (
                                    <div className="shrink-0 mt-1.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/40">
                    <button
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 0}
                        className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                        Önceki
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages - 1}
                        className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                        Sonraki
                    </button>
                </div>
            )}
        </div>
    )
}
