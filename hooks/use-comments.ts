"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import type { Comment, Reply } from "@/components/comments/types"

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
    const commentsRef = useRef<Comment[]>([])
    commentsRef.current = comments

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
        }, 100)
    }, [scrollRef])

    // İlk yükleme: son 20 yorum
    const fetchComments = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/comments?menuDate=${menuDate}&limit=20`)
            if (res.ok) {
                const data = await res.json()
                setComments(data.comments)
                setHasMore(data.hasMore ?? false)
                scrollToBottom()
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error)
        } finally {
            setLoading(false)
        }
    }, [menuDate, scrollToBottom])

    // Sessiz polling: sadece en son ID'den sonraki yeni yorumlar
    const pollNewComments = useCallback(async (maxId: number) => {
        try {
            const res = await fetch(`/api/comments?menuDate=${menuDate}&after=${maxId}`)
            if (res.ok) {
                const data = await res.json()
                const newOnes = data.comments as Array<Comment | Reply>
                if (newOnes.length > 0) {
                    setComments((prev) => {
                        const existingIds = new Set<number>()
                        prev.forEach((c) => {
                            existingIds.add(c.id)
                            c.replies.forEach((r) => existingIds.add(r.id))
                        })

                        const fresh = newOnes.filter((c) => !existingIds.has(c.id))
                        if (fresh.length === 0) return prev

                        const newParents = fresh.filter((c) => c.parentId === null) as Comment[]
                        const newReplies = fresh.filter((c) => c.parentId !== null) as Reply[]

                        let updated = [
                            ...prev,
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
            }
        } catch (error) {
            console.error("Polling error:", error)
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
                const older = data.comments as Comment[]
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
    const sendComment = async (content: string): Promise<boolean> => {
        setSending(true)
        sendingRef.current = true
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuDate, content }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Yorum gönderilemedi.", { duration: 3000 })
                return false
            }
            setComments((prev) => [...prev, { ...data.comment, replies: [] as Reply[] }])
            scrollToBottom()
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
    const sendReply = async (parentId: number, content: string): Promise<boolean> => {
        setSendingReply(true)
        sendingRef.current = true
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuDate, content, parentId }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Yanıt gönderilemedi.", { duration: 3000 })
                return false
            }
            setComments((prev) =>
                prev.map((c) =>
                    c.id === parentId
                        ? { ...c, replies: [...c.replies, data.comment as Reply] }
                        : c
                )
            )
            return true
        } catch {
            toast.error("Bir hata oluştu.", { duration: 2000 })
            return false
        } finally {
            setSendingReply(false)
            sendingRef.current = false
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

    // İlk açılış fetch'i
    useEffect(() => {
        if (open) {
            fetchComments()
        }
    }, [open, fetchComments])

    // Otomatik yenileme — 20 saniyede bir (sadece yeni yorumlar)
    // Sayfa görünür olmadığında polling durur
    useEffect(() => {
        if (!open) return
        let interval: ReturnType<typeof setInterval> | null = null

        const startPolling = () => {
            if (interval) return
            interval = setInterval(() => {
                const current = commentsRef.current
                if (!sendingRef.current && current.length > 0) {
                    const allIds = [
                        ...current.map((c) => c.id),
                        ...current.flatMap((c) => c.replies.map((r) => r.id)),
                    ]
                    const maxId = Math.max(...allIds)
                    pollNewComments(maxId)
                }
            }, 20_000)
        }

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval)
                interval = null
            }
        }

        const handleVisibility = () => {
            if (document.hidden) {
                stopPolling()
            } else {
                startPolling()
            }
        }

        if (!document.hidden) {
            startPolling()
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
    }
}
