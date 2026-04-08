"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { z } from "zod"
import type { Comment, Reply } from "@/components/comments/types"

// ─── Runtime API response schemas ────────────────────────────────────────────

const ReplySchema = z.object({
    id: z.number(),
    userId: z.string(),
    userName: z.string().nullable(),
    userImage: z.string().nullable(),
    content: z.string(),
    imageUrl: z.string().nullable(),
    parentId: z.number().nullable(),
    createdAt: z.string(),
    reactions: z.record(z.string(), z.number()).default({}),
    userReaction: z.string().nullable().default(null),
})

const CommentSchema = ReplySchema.extend({
    replies: z.array(ReplySchema).default([]),
})

const CommentListSchema = z.array(CommentSchema)

function parseComments(raw: unknown): Comment[] {
    const result = CommentListSchema.safeParse(raw)
    if (!result.success) {
        console.warn("[use-comments] API response validation failed:", result.error.flatten())
        return []
    }
    return result.data as Comment[]
}

function parseComment(raw: unknown): Comment | null {
    const result = CommentSchema.safeParse(raw)
    if (!result.success) {
        console.warn("[use-comments] Comment validation failed:", result.error.flatten())
        return null
    }
    return result.data as Comment
}

interface UseCommentsOptions {
    open: boolean
    menuDate: string
    scrollRef: React.RefObject<HTMLDivElement>
}

export function useComments({ open, menuDate, scrollRef }: UseCommentsOptions) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [sending, setSending] = useState(false)
    const [sendingReply, setSendingReply] = useState(false)
    const sendingRef = useRef(false)
    const pollFailCount = useRef(0)
    const commentsRef = useRef<Comment[]>([])
    commentsRef.current = comments

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
        }, 100)
    }, [scrollRef])

    // İlk yükleme: son 20 yorum — AbortController ile eski istekler iptal edilir
    const fetchComments = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/comments?menuDate=${menuDate}&limit=20`, { signal })
            if (res.ok) {
                const data = await res.json()
                setComments(parseComments(data.comments))
                setHasMore(data.hasMore ?? false)
                scrollToBottom()
            } else if (res.status === 429) {
                const data = await res.json().catch(() => ({}))
                toast.error(data.error || "Çok fazla istek gönderdiniz. Lütfen bekleyin.", { duration: 4000 })
            }
        } catch (error) {
            if ((error as { name?: string }).name !== "AbortError") {
                console.error("Failed to fetch comments:", error)
            }
        } finally {
            setLoading(false)
        }
    }, [menuDate, scrollToBottom])

    // Sessiz polling: sadece en son ID'den sonraki yeni yorumlar
    const pollNewComments = useCallback(async (maxId: number) => {
        try {
            const res = await fetch(`/api/comments?menuDate=${menuDate}&after=${maxId}`)
            if (res.ok) {
                pollFailCount.current = 0
                const data = await res.json()
                if (!Array.isArray(data.comments)) return
                type ParsedReply = z.SafeParseReturnType<unknown, z.infer<typeof ReplySchema>>
                const newOnes = (data.comments as unknown[])
                    .map((c) => ReplySchema.safeParse(c))
                    .filter((r: ParsedReply): r is z.SafeParseSuccess<z.infer<typeof ReplySchema>> => r.success)
                    .map((r: z.SafeParseSuccess<z.infer<typeof ReplySchema>>) => r.data) as Array<Comment | Reply>
                if (newOnes.length > 0) {
                    setComments((prev) => {
                        const existingIds = new Set<number>()
                        prev.forEach((c) => {
                            existingIds.add(c.id)
                            c.replies.forEach((r) => existingIds.add(r.id))
                        })

                        // Update reactions on existing comments/replies
                        const incomingMap = new Map<number, { reactions: Record<string, number>; userReaction: string | null }>()
                        for (const item of newOnes) {
                            if (existingIds.has(item.id)) {
                                incomingMap.set(item.id, { reactions: item.reactions, userReaction: item.userReaction })
                            }
                        }

                        const fresh = newOnes.filter((c) => !existingIds.has(c.id))

                        let updated = prev.map((c) => {
                            const parentUpdate = incomingMap.get(c.id)
                            const updatedReplies = c.replies.map((r) => {
                                const replyUpdate = incomingMap.get(r.id)
                                return replyUpdate ? { ...r, ...replyUpdate } : r
                            })
                            return parentUpdate
                                ? { ...c, ...parentUpdate, replies: updatedReplies }
                                : { ...c, replies: updatedReplies }
                        })

                        if (fresh.length === 0 && incomingMap.size > 0) return updated
                        if (fresh.length === 0) return prev

                        const newParents = fresh.filter((c) => c.parentId === null) as Comment[]
                        const newReplies = fresh.filter((c) => c.parentId !== null) as Reply[]

                        updated = [
                            ...updated,
                            ...newParents.map((p) => ({ ...p, replies: [] as Reply[] })),
                        ]
                        for (const reply of newReplies) {
                            updated = updated.map((c) =>
                                c.id === reply.parentId
                                    ? { ...c, replies: [...c.replies, reply] }
                                    : c
                            )
                        }
                        scrollToBottom()
                        return updated
                    })
                }
            } else {
                pollFailCount.current++
            }
        } catch (error) {
            console.error("Polling error:", error)
            pollFailCount.current++
            if (pollFailCount.current === 3) {
                toast.error("Yeni yorumlar yüklenemiyor. Bağlantınızı kontrol edin.", { duration: 4000 })
            }
        }
    }, [menuDate, scrollToBottom])

    // Daha eski yorumları yükle
    const loadMoreComments = async () => {
        if (loadingMore || comments.length === 0) return
        const minId = Math.min(...comments.map((c) => c.id))
        setLoadingMore(true)
        try {
            const res = await fetch(`/api/comments?menuDate=${menuDate}&before=${minId}&limit=20`)
            if (res.ok) {
                const data = await res.json()
                const older = parseComments(data.comments)
                setHasMore(data.hasMore ?? false)
                if (older.length > 0) {
                    const scrollEl = scrollRef.current
                    const prevScrollHeight = scrollEl?.scrollHeight ?? 0
                    setComments((prev) => {
                        const existingIds = new Set(prev.map((c) => c.id))
                        return [...older.filter((c) => !existingIds.has(c.id)), ...prev]
                    })
                    setTimeout(() => {
                        if (scrollEl) {
                            scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollHeight
                        }
                    }, 0)
                }
            }
        } catch (error) {
            console.error("Load more error:", error)
        } finally {
            setLoadingMore(false)
        }
    }

    // Yeni yorum gönder — başarıda true döner
    const sendComment = async (content: string, imageUrl?: string, mentionedUserIds?: string[]): Promise<boolean> => {
        setSending(true)
        sendingRef.current = true
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuDate, content: content || "", imageUrl, mentionedUserIds }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Yorum gönderilemedi.", { duration: 3000 })
                return false
            }
            const parsed = parseComment({ ...data.comment, replies: [] })
            if (parsed) {
                setComments((prev) => [...prev, parsed])
                scrollToBottom()
            }
            return true
        } catch {
            toast.error("Bir hata oluştu.", { duration: 2000 })
            return false
        } finally {
            setSending(false)
            sendingRef.current = false
        }
    }

    // Yanıt gönder — başarıda true döner
    const sendReply = async (parentId: number, content: string, imageUrl?: string, mentionedUserIds?: string[]): Promise<boolean> => {
        setSendingReply(true)
        sendingRef.current = true
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuDate, content: content || "", imageUrl, parentId, mentionedUserIds }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Yanıt gönderilemedi.", { duration: 3000 })
                return false
            }
            const parsed = ReplySchema.safeParse(data.comment)
            if (parsed.success) {
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === parentId
                            ? { ...c, replies: [...c.replies, parsed.data as Reply] }
                            : c
                    )
                )
            }
            return true
        } catch {
            toast.error("Bir hata oluştu.", { duration: 2000 })
            return false
        } finally {
            setSendingReply(false)
            sendingRef.current = false
        }
    }

    // Emoji tepki toggle
    const toggleReaction = async (commentId: number, emoji: string): Promise<boolean> => {
        // Snapshot for rollback
        const snapshot = [...comments]

        // Optimistic update
        setComments((prev) =>
            prev.map((c) => {
                const updateItem = <T extends Comment | Reply>(item: T): T => {
                    if (item.id !== commentId) return item
                    const sameEmoji = item.userReaction === emoji
                    const oldEmoji = item.userReaction
                    const newReactions = { ...item.reactions }

                    // Remove old reaction count if changing
                    if (oldEmoji && oldEmoji !== emoji) {
                        newReactions[oldEmoji] = (newReactions[oldEmoji] || 1) - 1
                        if (newReactions[oldEmoji] <= 0) delete newReactions[oldEmoji]
                    }

                    if (sameEmoji) {
                        // Toggle off
                        newReactions[emoji] = (newReactions[emoji] || 1) - 1
                        if (newReactions[emoji] <= 0) delete newReactions[emoji]
                        return { ...item, reactions: newReactions, userReaction: null }
                    } else {
                        // Add new
                        newReactions[emoji] = (newReactions[emoji] || 0) + 1
                        return { ...item, reactions: newReactions, userReaction: emoji }
                    }
                }

                if (c.id === commentId) return updateItem(c) as Comment
                return {
                    ...c,
                    replies: c.replies.map((r) =>
                        r.id === commentId ? (updateItem(r) as Reply) : r
                    ),
                }
            })
        )

        try {
            const res = await fetch("/api/comments/reactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId, emoji }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                setComments(snapshot)
                toast.error(data.error || "Bir hata oluştu.", { duration: 2000 })
                return false
            }
            return true
        } catch {
            setComments(snapshot)
            toast.error("Bir hata oluştu.", { duration: 2000 })
            return false
        }
    }

    // Yorum sil
    const deleteComment = async (id: number): Promise<void> => {
        try {
            const res = await fetch(`/api/comments/${id}`, { method: "DELETE" })
            if (res.ok) {
                setComments((prev) =>
                    prev
                        .filter((c) => c.id !== id)
                        .map((c) => ({
                            ...c,
                            replies: c.replies.filter((r) => r.id !== id),
                        }))
                )
                toast.success("Yorum silindi.", { duration: 2000 })
            } else {
                const data = await res.json()
                toast.error(data.error || "Yorum silinemedi.", { duration: 2000 })
            }
        } catch {
            toast.error("Bir hata oluştu.", { duration: 2000 })
        }
    }

    // İlk açılış fetch'i — menuDate değişince eski istek iptal edilir, stale veri temizlenir
    useEffect(() => {
        if (!open) return
        const controller = new AbortController()
        setComments([])
        setHasMore(false)
        fetchComments(controller.signal)
        return () => controller.abort()
    }, [open, fetchComments])

    // Otomatik yenileme — 20 saniyede bir (sadece yeni yorumlar)
    // Sayfa görünür olmadığında polling durur
    // Exponential backoff: hata arttıkça 20s → 40s → 80s (max 80s), başarıda 20s'e döner
    useEffect(() => {
        if (!open) return
        let timeout: ReturnType<typeof setTimeout> | null = null
        let stopped = false

        const schedulePoll = () => {
            if (timeout || stopped) return
            const delay = Math.min(20_000 * Math.pow(2, pollFailCount.current), 80_000)
            timeout = setTimeout(async () => {
                const current = commentsRef.current
                if (!sendingRef.current && current.length > 0) {
                    const allIds = [
                        ...current.map((c) => c.id),
                        ...current.flatMap((c) => c.replies.map((r) => r.id)),
                    ]
                    const maxId = Math.max(...allIds)
                    await pollNewComments(maxId)
                }
                timeout = null
                if (!stopped) schedulePoll()
            }, delay)
        }

        const stopPolling = () => {
            stopped = true
            if (timeout) {
                clearTimeout(timeout)
                timeout = null
            }
        }

        const resumePolling = () => {
            stopped = false
            schedulePoll()
        }

        const handleVisibility = () => {
            if (document.hidden) {
                stopPolling()
            } else {
                resumePolling()
            }
        }

        if (!document.hidden) {
            schedulePoll()
        }

        document.addEventListener("visibilitychange", handleVisibility)

        return () => {
            stopPolling()
            document.removeEventListener("visibilitychange", handleVisibility)
        }
    }, [open, pollNewComments])

    return {
        comments,
        loading,
        loadingMore,
        hasMore,
        sending,
        sendingReply,
        loadMoreComments,
        sendComment,
        sendReply,
        deleteComment,
        toggleReaction,
    }
}
