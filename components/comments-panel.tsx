"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Flag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CommentReportDialog } from "@/components/comment-report-dialog"
import { AuthDrawer } from "@/components/auth-drawer"

interface Comment {
    id: number
    userId: string
    userName: string | null
    userImage: string | null
    content: string
    createdAt: string
}

interface CommentsPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    menuDate: string
}

const CHAR_LIMIT = 200

function formatRelativeTime(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "Az önce"
    if (diffMin < 60) return `${diffMin} dakika önce`
    if (diffHour < 24) return `${diffHour} saat önce`
    if (diffDay < 7) return `${diffDay} gün önce`
    return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

function getInitials(name: string | null): string {
    if (!name) return "?"
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

export function CommentsPanel({ open, onOpenChange, menuDate }: CommentsPanelProps) {
    const isMobile = useIsMobile()
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [sending, setSending] = useState(false)
    const [reportComment, setReportComment] = useState<Comment | null>(null)
    const [showAuthDrawer, setShowAuthDrawer] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())
    const sendingRef = useRef(false)
    const commentsRef = useRef<Comment[]>([])
    commentsRef.current = comments

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
        }, 100)
    }, [])

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
                const newOnes = data.comments as Comment[]
                if (newOnes.length > 0) {
                    setComments((prev) => {
                        const existingIds = new Set(prev.map((c) => c.id))
                        const fresh = newOnes.filter((c) => !existingIds.has(c.id))
                        if (fresh.length === 0) return prev
                        scrollToBottom()
                        return [...prev, ...fresh]
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
                    // Scroll pozisyonunu koru: eski yorumlar üste ekleniyor
                    const scrollEl = scrollRef.current
                    const prevScrollHeight = scrollEl?.scrollHeight ?? 0
                    setComments((prev) => {
                        const existingIds = new Set(prev.map((c) => c.id))
                        return [...older.filter((c) => !existingIds.has(c.id)), ...prev]
                    })
                    // Yükleme sonrası scroll konumunu koru
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

    // İlk açılış fetch'i
    useEffect(() => {
        if (open) {
            fetchComments()
        }
    }, [open, fetchComments])

    // Otomatik yenileme — 20 saniyede bir (sadece yeni yorumlar)
    // Sayfa görünür olmadığında polling durur (Bulgu 8)
    useEffect(() => {
        if (!open) return
        let interval: ReturnType<typeof setInterval> | null = null

        const startPolling = () => {
            if (interval) return
            interval = setInterval(() => {
                const current = commentsRef.current
                if (!sendingRef.current && current.length > 0) {
                    const maxId = Math.max(...current.map((c) => c.id))
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

        // Only start polling if page is visible
        if (!document.hidden) {
            startPolling()
        }

        document.addEventListener("visibilitychange", handleVisibility)

        return () => {
            stopPolling()
            document.removeEventListener("visibilitychange", handleVisibility)
        }
    }, [open, pollNewComments])

    const handleSend = async () => {
        if (!session) {
            setShowAuthDrawer(true)
            return
        }

        const trimmed = newComment.trim()
        if (!trimmed) return

        setSending(true)
        sendingRef.current = true
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuDate, content: trimmed }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Yorum gönderilemedi.", { duration: 3000 })
                return
            }

            setComments((prev) => [...prev, data.comment])
            setNewComment("")
            scrollToBottom()
        } catch {
            toast.error("Bir hata oluştu.", { duration: 2000 })
        } finally {
            setSending(false)
            sendingRef.current = false
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirmId) return
        const commentId = deleteConfirmId
        setDeleteConfirmId(null)
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: "DELETE",
            })

            if (res.ok) {
                setComments((prev) => prev.filter((c) => c.id !== commentId))
                toast.success("Yorum silindi.", { duration: 2000 })
            } else {
                const data = await res.json()
                toast.error(data.error || "Yorum silinemedi.", { duration: 2000 })
            }
        } catch {
            toast.error("Bir hata oluştu.", { duration: 2000 })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const canDelete = (comment: Comment) => {
        if (!session?.user?.id) return false
        if (comment.userId === session.user.id) return true
        if (session.user.isModerator) return true
        return false
    }

    const canReport = (comment: Comment) => {
        if (!session?.user?.id) return false
        return comment.userId !== session.user.id
    }

    // Yorum listesi - scroll edilebilir alan
    const commentsList = (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-4 py-2">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-muted-foreground/30 border-t-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <p className="text-sm">Henüz yorum yapılmamış.</p>
                    </div>
                ) : (
                    <div>
                        {/* Daha eski yorum yükleme butonu */}
                        {hasMore && (
                            <div className="flex justify-center pb-2 pt-1">
                                <button
                                    onClick={loadMoreComments}
                                    disabled={loadingMore}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border border-muted-foreground/40 border-t-foreground" />
                                            Yükleniyor...
                                        </>
                                    ) : (
                                        "↑ Daha eski yorumları göster"
                                    )}
                                </button>
                            </div>
                        )}
                        {comments.map((comment) => (
                            <div key={comment.id} className="py-1.5">
                                <div className="flex items-start gap-2.5">
                                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                                        {comment.userImage && (
                                            <AvatarImage
                                                src={comment.userImage}
                                                alt={comment.userName || "Kullanıcı"}
                                            />
                                        )}
                                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                            {getInitials(comment.userName)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm font-semibold text-foreground truncate">
                                                    {comment.userName || "Anonim"}
                                                </span>
                                                <span className="text-xs text-muted-foreground/60 shrink-0">
                                                    {formatRelativeTime(comment.createdAt)}
                                                </span>
                                                <span className="text-[10px] font-mono font-medium text-muted-foreground/60 bg-muted/80 border border-border/40 px-1.5 py-0.5 rounded-md shrink-0 leading-none select-none">
                                                    #{comment.id}
                                                </span>
                                            </div>

                                            {(canDelete(comment) || canReport(comment)) && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground shrink-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36">
                                                        {canReport(comment) && (
                                                            <DropdownMenuItem
                                                                onClick={() => setReportComment(comment)}
                                                                className="text-xs"
                                                            >
                                                                <Flag className="h-3.5 w-3.5 mr-2" />
                                                                Raporla
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canDelete(comment) && (
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleteConfirmId(comment.id)}
                                                                className="text-xs text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                Sil
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>

                                        {(() => {
                                            const MAX_CHARS = 100
                                            const isLong = comment.content.length > MAX_CHARS
                                            const isExpanded = expandedComments.has(comment.id)
                                            const displayText =
                                                isLong && !isExpanded
                                                    ? comment.content.slice(0, MAX_CHARS) + "..."
                                                    : comment.content
                                            return (
                                                <>
                                                    <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed break-words">
                                                        {displayText}
                                                    </p>
                                                    {isLong && (
                                                        <button
                                                            onClick={() => {
                                                                setExpandedComments((prev) => {
                                                                    const next = new Set(prev)
                                                                    if (isExpanded) next.delete(comment.id)
                                                                    else next.add(comment.id)
                                                                    return next
                                                                })
                                                            }}
                                                            className="text-xs text-primary hover:underline mt-0.5"
                                                        >
                                                            {isExpanded ? "daha az göster" : "devamını göster"}
                                                        </button>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

    // Sabit input alanı — her zaman en altta
    const inputArea = (
        <div className="border-t border-border/40 px-3 py-2.5 shrink-0">
            <div className="flex items-stretch gap-2" style={{ height: "34px" }}>
                <div className="relative flex-1 h-full">
                    <textarea
                        value={newComment}
                        onChange={(e) => {
                            if (e.target.value.length <= CHAR_LIMIT) {
                                setNewComment(e.target.value)
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Yorumunuzu yazın..."
                        maxLength={CHAR_LIMIT}
                        rows={1}
                        className="w-full h-full resize-none bg-muted/50 border border-border/40 rounded-lg pl-3 pr-14 py-0 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring overflow-hidden"
                        style={{ lineHeight: "34px" }}
                    />
                    <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded-md ${newComment.length >= CHAR_LIMIT
                        ? "bg-destructive/10 text-destructive"
                        : newComment.length >= CHAR_LIMIT * 0.8
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-muted text-muted-foreground/50"
                        }`}>
                        {newComment.length}/{CHAR_LIMIT}
                    </span>
                </div>
                <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={sending || !newComment.trim()}
                    className="h-full px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shrink-0 min-w-[60px]"
                >
                    {sending ? (
                        <span className="flex items-center gap-[3px]">
                            <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                    ) : "Gönder"}
                </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 leading-tight mt-1.5 px-0.5">
                Lütfen saygılı ve yapıcı yorumlar yazın. Uygunsuz içerik barındıran yorumlar görürseniz lütfen raporlayın.
            </p>
        </div>
    )

    if (isMobile) {
        return (
            <>
                <Drawer open={open} onOpenChange={onOpenChange}>
                    <DrawerContent
                        className="overflow-hidden"
                        style={{ display: "flex", flexDirection: "column", maxHeight: "85vh" }}
                    >
                        <DrawerHeader className="px-4 pb-2 shrink-0">
                            <DrawerTitle className="text-lg">Yorumlar</DrawerTitle>
                        </DrawerHeader>
                        {commentsList}
                        {inputArea}
                    </DrawerContent>
                </Drawer>

                <CommentReportDialog
                    comment={reportComment}
                    onClose={() => setReportComment(null)}
                />

                <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
                    <AlertDialogContent className="max-w-[360px] sm:max-w-md p-4 gap-3">
                        <AlertDialogHeader className="gap-1">
                            <AlertDialogTitle>Yorumu Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AuthDrawer
                    open={showAuthDrawer}
                    onOpenChange={setShowAuthDrawer}
                    message="Yorum yapmak için giriş yapmanız gerekmektedir."
                />
            </>
        )
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="sm:max-w-md p-0 gap-0 overflow-hidden"
                    style={{ display: "flex", flexDirection: "column", maxHeight: "80vh" }}
                >
                    <DialogHeader className="px-4 py-3 border-b border-border/40 shrink-0">
                        <DialogTitle className="text-lg">Yorumlar</DialogTitle>
                    </DialogHeader>
                    {commentsList}
                    {inputArea}
                </DialogContent>
            </Dialog>

            <CommentReportDialog
                comment={reportComment}
                onClose={() => setReportComment(null)}
            />

            <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
                <AlertDialogContent className="max-w-[360px] sm:max-w-md p-4 gap-3">
                    <AlertDialogHeader className="gap-1">
                        <AlertDialogTitle>Yorumu Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AuthDrawer
                open={showAuthDrawer}
                onOpenChange={setShowAuthDrawer}
                message="Yorum yapmak için giriş yapmanız gerekmektedir."
            />
        </>
    )
}
