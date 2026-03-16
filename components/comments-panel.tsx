"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useIsMobile } from "@/hooks/use-mobile"
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
import { CommentReportDialog } from "@/components/comment-report-dialog"
import { AuthDrawer } from "@/components/auth-drawer"
import { useComments } from "@/hooks/use-comments"
import { CommentsList } from "@/components/comments/comments-list"
import { CommentInput } from "@/components/comments/comment-input"
import { CHAR_LIMIT } from "@/components/comments/types"
import type { Comment, Reply, CommentsPanelProps } from "@/components/comments/types"

export function CommentsPanel({ open, onOpenChange, menuDate }: CommentsPanelProps) {
    const isMobile = useIsMobile()
    const { data: session } = useSession()
    const scrollRef = useRef<HTMLDivElement>(null!)

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

    const handleSend = async () => {
        if (!session) { setShowAuthDrawer(true); return }
        const trimmed = newComment.trim()
        if (!trimmed) return
        const ok = await sendComment(trimmed)
        if (ok) setNewComment("")
    }

    const handleSendReply = async (parentId: number) => {
        if (!session) { setShowAuthDrawer(true); return }
        const trimmed = replyContent.trim()
        if (!trimmed) return
        const ok = await sendReply(parentId, trimmed)
        if (ok) {
            setExpandedReplies((prev) => { const next = new Set(prev); next.add(parentId); return next })
            setReplyContent("")
            setReplyingToId(null)
        }
    }

    const confirmDelete = async () => {
        if (!deleteConfirmId) return
        const id = deleteConfirmId
        setDeleteConfirmId(null)
        await deleteComment(id)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
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
        onReplyContentChange: setReplyContent,
        onSetReplyingTo: setReplyingToId,
        onSendReply: handleSendReply,
        onOpenMenuChange: setOpenMenuId,
        onReport: setReportComment,
        onDelete: setDeleteConfirmId,
        onToggleExpand: handleToggleExpand,
        onToggleReplies: handleToggleReplies,
        onShowAuth: () => setShowAuthDrawer(true),
        onLoadMore: loadMoreComments,
        canDelete,
        canReport,
    }

    const sharedInputProps = {
        value: newComment,
        onChange: setNewComment,
        onSend: handleSend,
        onKeyDown: handleKeyDown,
        sending,
        charLimit: CHAR_LIMIT,
    }

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
                        style={{ display: "flex", flexDirection: "column", maxHeight: "75vh" }}
                    >
                        <DrawerHeader className="px-4 pb-2 shrink-0">
                            <DrawerTitle className="text-lg">Yorumlar</DrawerTitle>
                        </DrawerHeader>
                        <CommentsList {...sharedListProps} />
                        <CommentInput {...sharedInputProps} />
                    </DrawerContent>
                </Drawer>

                <CommentReportDialog comment={reportComment} onClose={() => setReportComment(null)} />
                {deleteDialog}
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
                    <CommentsList {...sharedListProps} />
                    <CommentInput {...sharedInputProps} />
                </DialogContent>
            </Dialog>

            <CommentReportDialog comment={reportComment} onClose={() => setReportComment(null)} />
            {deleteDialog}
            <AuthDrawer
                open={showAuthDrawer}
                onOpenChange={setShowAuthDrawer}
                message="Yorum yapmak için giriş yapmanız gerekmektedir."
            />
        </>
    )
}
