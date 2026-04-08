"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { CommentReportDialog } from "@/components/comment-report-dialog"
import { AuthModal } from "@/components/auth-modal"
import { useComments } from "@/hooks/use-comments"
import { CommentsList } from "@/components/comments/comments-list"
import { MessageInput } from "@/components/comments/message-input"
import { ReplyImageProvider } from "@/components/comments/reply-image-context"
import { CHAR_LIMIT } from "@/components/comments/types"
import type { Comment, Reply, CommentsPanelProps } from "@/components/comments/types"
import { getTurkeyDate } from "@/lib/date-utils"
import { Info } from "lucide-react"

const MAX_IMAGE_DIMENSION = 2048
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Client-side image resize + WebP conversion via Canvas API
 */
const IMAGE_PROCESS_TIMEOUT = 10000 // 10 seconds

async function processImage(file: File): Promise<{ blob: Blob; previewUrl: string }> {
    const processPromise = new Promise<{ blob: Blob; previewUrl: string }>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const img = new window.Image()
            img.onload = () => {
                const canvas = document.createElement("canvas")
                let { width, height } = img

                // Resize if needed
                if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                    if (width > height) {
                        height = Math.round((height * MAX_IMAGE_DIMENSION) / width)
                        width = MAX_IMAGE_DIMENSION
                    } else {
                        width = Math.round((width * MAX_IMAGE_DIMENSION) / height)
                        height = MAX_IMAGE_DIMENSION
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (!ctx) { reject(new Error("Canvas 2D context not available")); return }
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error("Canvas toBlob failed")); return }
                        const previewUrl = URL.createObjectURL(blob)
                        resolve({ blob, previewUrl })
                    },
                    "image/webp",
                    0.85
                )
            }
            img.onerror = () => reject(new Error("Image load failed"))
            img.src = reader.result as string
        }
        reader.onerror = () => reject(new Error("FileReader failed"))
        reader.readAsDataURL(file)
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Fotoğraf işleme zaman aşımına uğradı.")), IMAGE_PROCESS_TIMEOUT)
    )

    return Promise.race([processPromise, timeoutPromise])
}

/**
 * Upload image to R2 via server-side API
 */
async function uploadImageToR2(blob: Blob): Promise<string> {
    const formData = new FormData()
    formData.append("file", blob, "photo.webp")

    const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
    })

    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || "Fotoğraf yüklenemedi.")
    }

    return data.publicUrl
}

export function CommentsPanel({ open, onOpenChange, menuDate }: CommentsPanelProps) {
    const isMobile = useIsMobile()
    const { data: session } = useSession()
    const scrollRef = useRef<HTMLDivElement>(null!)
    const isToday = menuDate === getTurkeyDate()

    // UI state
    const [newComment, setNewComment] = useState("")
    const [reportComment, setReportComment] = useState<Comment | Reply | null>(null)
    const [showAuthDrawer, setShowAuthDrawer] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
    const [openMenuId, setOpenMenuId] = useState<number | null>(null)
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set())
    const [replyingToId, setReplyingToId] = useState<number | null>(null)
    const [replyContent, setReplyContent] = useState("")
    const [commentMentionIds, setCommentMentionIds] = useState<string[]>([])
    const [replyMentionIds, setReplyMentionIds] = useState<string[]>([])

    // Image state — comment input
    const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null)
    const [commentImageFile, setCommentImageFile] = useState<File | null>(null)
    const [commentImageBlob, setCommentImageBlob] = useState<Blob | null>(null)
    const [commentImageLoading, setCommentImageLoading] = useState(false)

    // Image state — reply input
    const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)
    const [replyImageFile, setReplyImageFile] = useState<File | null>(null)
    const [replyImageBlob, setReplyImageBlob] = useState<Blob | null>(null)
    const [replyImageLoading, setReplyImageLoading] = useState(false)

    // Refs to track current preview URLs for unmount cleanup.
    // Using refs avoids stale-closure issues in the cleanup useEffect below.
    const commentImagePreviewRef = useRef<string | null>(null)
    const replyImagePreviewRef = useRef<string | null>(null)
    commentImagePreviewRef.current = commentImagePreview
    replyImagePreviewRef.current = replyImagePreview

    // Data hook
    const {
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
    } = useComments({ open, menuDate, scrollRef })

    const canDelete = (comment: Comment | Reply) => {
        if (!session?.user?.id) return false
        if (comment.userId === session.user.id) return true
        if (session.user.isModerator) return true
        return false
    }

    const canReport = (comment: Comment | Reply) => {
        if (!session?.user?.id) return false
        return comment.userId !== session.user.id
    }

    // Image handlers — comment
    const handleCommentImageSelect = useCallback(async (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error("Dosya boyutu en fazla 50MB olabilir.")
            return
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            toast.error("Sadece JPEG, PNG ve WebP dosyaları desteklenir.")
            return
        }
        setCommentImageLoading(true)
        try {
            const { blob, previewUrl } = await processImage(file)
            setCommentImageFile(file)
            setCommentImageBlob(blob)
            setCommentImagePreview(previewUrl)
        } catch {
            toast.error("Fotoğraf işlenemedi.")
        } finally {
            setCommentImageLoading(false)
        }
    }, [])

    const handleCommentImageClear = useCallback(() => {
        if (commentImagePreview) URL.revokeObjectURL(commentImagePreview)
        setCommentImageFile(null)
        setCommentImageBlob(null)
        setCommentImagePreview(null)
    }, [commentImagePreview])

    // Image handlers — reply
    const handleReplyImageSelect = useCallback(async (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error("Dosya boyutu en fazla 50MB olabilir.")
            return
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            toast.error("Sadece JPEG, PNG ve WebP dosyaları desteklenir.")
            return
        }
        setReplyImageLoading(true)
        try {
            const { blob, previewUrl } = await processImage(file)
            setReplyImageFile(file)
            setReplyImageBlob(blob)
            setReplyImagePreview(previewUrl)
        } catch {
            toast.error("Fotoğraf işlenemedi.")
        } finally {
            setReplyImageLoading(false)
        }
    }, [])

    const handleReplyImageClear = useCallback(() => {
        if (replyImagePreview) URL.revokeObjectURL(replyImagePreview)
        setReplyImageFile(null)
        setReplyImageBlob(null)
        setReplyImagePreview(null)
    }, [replyImagePreview])

    // Cleanup Object URLs on unmount — refs always hold the latest URL,
    // so the closure correctly revokes whichever preview is active at unmount time.
    useEffect(() => {
        return () => {
            if (commentImagePreviewRef.current) URL.revokeObjectURL(commentImagePreviewRef.current)
            if (replyImagePreviewRef.current) URL.revokeObjectURL(replyImagePreviewRef.current)
        }
    }, [])

    const handleSend = async () => {
        if (!isToday) return
        if (!session) { setShowAuthDrawer(true); return }
        if (sending || commentImageLoading) return
        const trimmed = newComment.trim()
        if (!trimmed && !commentImageBlob) return

        let imageUrl: string | undefined
        if (commentImageBlob) {
            setCommentImageLoading(true)
            try {
                imageUrl = await uploadImageToR2(commentImageBlob)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Fotoğraf yüklenemedi.")
                return
            } finally {
                setCommentImageLoading(false)
            }
        }

        const ok = await sendComment(trimmed, imageUrl, commentMentionIds.length > 0 ? commentMentionIds : undefined)
        if (ok) {
            setNewComment("")
            setCommentMentionIds([])
            handleCommentImageClear()
        }
    }

    const handleSendReply = async (parentId: number) => {
        if (!isToday) return
        if (!session) { setShowAuthDrawer(true); return }
        if (sendingReply || replyImageLoading) return
        const trimmed = replyContent.trim()
        if (!trimmed && !replyImageBlob) return

        let imageUrl: string | undefined
        if (replyImageBlob) {
            setReplyImageLoading(true)
            try {
                imageUrl = await uploadImageToR2(replyImageBlob)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Fotoğraf yüklenemedi.")
                return
            } finally {
                setReplyImageLoading(false)
            }
        }

        const ok = await sendReply(parentId, trimmed, imageUrl, replyMentionIds.length > 0 ? replyMentionIds : undefined)
        if (ok) {
            setExpandedReplies((prev) => { const next = new Set(prev); next.add(parentId); return next })
            setReplyContent("")
            setReplyMentionIds([])
            setReplyingToId(null)
            handleReplyImageClear()
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirmId) return
        const id = deleteConfirmId
        setDeleteConfirmId(null)
        await deleteComment(id)
    }

    const handleToggleExpand = (id: number) => {
        setExpandedComments((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleToggleReplies = (id: number) => {
        setExpandedReplies((prev) => { const next = new Set(prev); next.add(id); return next })
    }

    const handleSetReplyingTo = (id: number | null) => {
        // Warn if switching reply target with an unsaved image
        if (replyImageBlob && id !== replyingToId) {
            const confirmed = window.confirm("Eklediğiniz fotoğraf kaybolacak. Devam etmek istiyor musunuz?")
            if (!confirmed) return
        }
        setReplyingToId(id)
        handleReplyImageClear()
    }

    const replyImageContextValue = {
        replyImagePreview,
        replyImageFile,
        replyImageLoading,
        onReplyImageSelect: handleReplyImageSelect,
        onReplyImageClear: handleReplyImageClear,
    }

    const sharedListProps = {
        comments,
        loading,
        hasMore,
        loadingMore,
        isMobile,
        scrollRef,
        expandedComments,
        expandedReplies,
        replyingToId,
        replyContent,
        session,
        openMenuId,
        sendingReply,
        commentsDisabled: !isToday,
        onReplyContentChange: setReplyContent,
        onSetReplyingTo: handleSetReplyingTo,
        onSendReply: handleSendReply,
        onOpenMenuChange: setOpenMenuId,
        onReport: setReportComment,
        onDelete: setDeleteConfirmId,
        onToggleExpand: handleToggleExpand,
        onToggleReplies: handleToggleReplies,
        onShowAuth: () => setShowAuthDrawer(true),
        onToggleReaction: toggleReaction,
        onLoadMore: loadMoreComments,
        canDelete,
        canReport,
        onReplyMentionAdd: (user: { id: string }) => {
            setReplyMentionIds((prev) => prev.includes(user.id) ? prev : [...prev, user.id])
        },
    }

    const sharedInputProps = {
        mode: "comment" as const,
        value: newComment,
        onChange: setNewComment,
        onSend: handleSend,
        sending,
        charLimit: CHAR_LIMIT,
        imagePreview: commentImagePreview,
        imageFile: commentImageFile,
        onImageSelect: handleCommentImageSelect,
        onImageClear: handleCommentImageClear,
        imageLoading: commentImageLoading,
        onMentionAdd: (user: { id: string }) => {
            setCommentMentionIds((prev) => prev.includes(user.id) ? prev : [...prev, user.id])
        },
        isMobile,
    }

    const commentDisabledBanner = (
        <div className="border-t border-border/40 px-3 py-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <span className="text-sm text-muted-foreground/70">
                    Yalnızca günün menüsüne yorum yapabilirsiniz.
                </span>
            </div>
        </div>
    )

    const deleteDialog = (
        <AlertDialog open={deleteConfirmId !== null} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null) }}>
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
                            <DrawerDescription>
                                Saygılı ve yapıcı olun, uygunsuz içerikleri raporlayın.
                            </DrawerDescription>
                        </DrawerHeader>
                        <ReplyImageProvider value={replyImageContextValue}>
                        <CommentsList {...sharedListProps} />
                    </ReplyImageProvider>
                        {isToday ? <MessageInput {...sharedInputProps} /> : commentDisabledBanner}
                    </DrawerContent>
                </Drawer>

                <CommentReportDialog comment={reportComment} onClose={() => setReportComment(null)} />
                {deleteDialog}
                <AuthModal
                    open={showAuthDrawer}
                    onOpenChange={setShowAuthDrawer}
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
                    <DialogHeader className="px-4 py-2 border-b border-border/40 shrink-0 gap-0.5">
                        <DialogTitle className="text-lg">Yorumlar</DialogTitle>
                        <DialogDescription>
                            Saygılı ve yapıcı olun, uygunsuz içerikleri raporlayın.
                        </DialogDescription>
                    </DialogHeader>
                    <ReplyImageProvider value={replyImageContextValue}>
                        <CommentsList {...sharedListProps} />
                    </ReplyImageProvider>
                    {isToday ? <MessageInput {...sharedInputProps} /> : commentDisabledBanner}
                </DialogContent>
            </Dialog>

            <CommentReportDialog comment={reportComment} onClose={() => setReportComment(null)} />
            {deleteDialog}
            <AuthModal
                open={showAuthDrawer}
                onOpenChange={setShowAuthDrawer}
            />
        </>
    )
}
