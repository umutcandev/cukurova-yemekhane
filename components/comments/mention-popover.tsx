"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "./utils"

interface MentionUser {
    id: string
    name: string | null
    image: string | null
}

interface MentionPopoverProps {
    query: string
    visible: boolean
    onSelect: (user: MentionUser) => void
    onClose: () => void
    isMobile: boolean
}

export function MentionPopover({ query, visible, onSelect, onClose, isMobile }: MentionPopoverProps) {
    const [users, setUsers] = useState<MentionUser[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const abortRef = useRef<AbortController | null>(null)

    const fetchUsers = useCallback(async (q: string) => {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
                signal: controller.signal,
            })
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
                setSelectedIndex(0)
            }
        } catch (err) {
            if ((err as { name?: string }).name !== "AbortError") {
                console.error("Mention search error:", err)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!visible || query.length < 3) {
            setUsers([])
            return
        }

        const timer = setTimeout(() => fetchUsers(query), 500)
        return () => clearTimeout(timer)
    }, [query, visible, fetchUsers])

    // Capture-phase listener to intercept keyboard events before textarea's onKeyDown fires
    useEffect(() => {
        if (!visible) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                e.stopPropagation()
                setSelectedIndex((i) => Math.min(i + 1, users.length - 1))
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                e.stopPropagation()
                setSelectedIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === "Enter" && users.length > 0) {
                e.preventDefault()
                e.stopPropagation()
                onSelect(users[selectedIndex])
            } else if (e.key === "Escape") {
                e.preventDefault()
                e.stopPropagation()
                onClose()
            }
        }
        document.addEventListener("keydown", handleKeyDown, true)
        return () => document.removeEventListener("keydown", handleKeyDown, true)
    }, [visible, users, selectedIndex, onSelect, onClose])

    const shouldShow = visible && (query.length >= 3 || users.length > 0)
    if (!shouldShow) return null

    const listContent = (
        <>
            {loading && users.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">Aranıyor...</div>
            )}
            {!loading && users.length === 0 && query.length >= 3 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">Kullanıcı bulunamadı</div>
            )}
            {users.map((user, index) => (
                <button
                    key={user.id}
                    onClick={() => onSelect(user)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                        index === selectedIndex ? "bg-accent" : ""
                    }`}
                >
                    <Avatar className="h-6 w-6">
                        {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                        <AvatarFallback className="text-[10px]">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user.name || "Anonim"}</span>
                </button>
            ))}
        </>
    )

    // Mobile: fixed overlay + absolutely positioned menu (same pattern as emoji-reaction-picker)
    if (isMobile) {
        return (
            <>
                <div className="fixed inset-0 z-40" onClick={onClose} />
                <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-popover border border-border rounded-lg shadow-md max-h-[200px] overflow-y-auto">
                    {listContent}
                </div>
            </>
        )
    }

    // Desktop: absolutely positioned, rendered via portal to escape overflow-hidden
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-popover border border-border rounded-lg shadow-md max-h-[200px] overflow-y-auto">
                {listContent}
            </div>
        </>
    )
}
