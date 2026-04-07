"use client"

import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import { CommentItem } from "./comment-item"
import type { Comment, Reply } from "./types"

interface CommentsListProps {
    comments: Comment[]
    loading: boolean
    hasMore: boolean
    loadingMore: boolean
    isMobile: boolean
    scrollRef: React.RefObject<HTMLDivElement>
    expandedComments: Set<number>
    expandedReplies: Set<number>
    replyingToId: number | null
    replyContent: string
    session: Session | null
    openMenuId: number | null
    sendingReply: boolean
    commentsDisabled: boolean
    onReplyContentChange: (val: string) => void
    onSetReplyingTo: (id: number | null) => void
    onSendReply: (parentId: number) => void
    onOpenMenuChange: (id: number | null) => void
    onReport: (comment: Comment | Reply) => void
    onDelete: (id: number) => void
    onToggleExpand: (id: number) => void
    onToggleReplies: (id: number) => void
    onShowAuth: () => void
    onToggleReaction: (commentId: number, emoji: string) => void
    onLoadMore: () => void
    canDelete: (comment: Comment | Reply) => boolean
    canReport: (comment: Comment | Reply) => boolean
}

export function CommentsList({
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
    commentsDisabled,
    onReplyContentChange,
    onSetReplyingTo,
    onSendReply,
    onOpenMenuChange,
    onReport,
    onDelete,
    onToggleExpand,
    onToggleReplies,
    onShowAuth,
    onToggleReaction,
    onLoadMore,
    canDelete,
    canReport,
}: CommentsListProps) {
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const el = scrollRef.current
        if (!el || !isMobile) return
        const handleScroll = () => setIsScrolled(el.scrollTop > 0)
        el.addEventListener("scroll", handleScroll, { passive: true })
        return () => el.removeEventListener("scroll", handleScroll)
    }, [scrollRef, isMobile])

    return (
        <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto"
            style={isMobile && isScrolled && !loading && comments.length > 0 ? {
                maskImage: "linear-gradient(to bottom, transparent 0%, black 32px, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 32px, black 100%)",
            } : undefined}
        >
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

                        {hasMore && (
                            <div className="flex justify-center pb-2 pt-1">
                                <button
                                    onClick={onLoadMore}
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
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                commentsDisabled={commentsDisabled}
                                expandedComments={expandedComments}
                                expandedReplies={expandedReplies}
                                replyingToId={replyingToId}
                                replyContent={replyContent}
                                session={session}
                                isMobile={isMobile}
                                openMenuId={openMenuId}
                                sendingReply={sendingReply}
                                onReplyContentChange={onReplyContentChange}
                                onSetReplyingTo={onSetReplyingTo}
                                onSendReply={onSendReply}
                                onOpenMenuChange={onOpenMenuChange}
                                onReport={onReport}
                                onDelete={onDelete}
                                onToggleExpand={onToggleExpand}
                                onToggleReplies={onToggleReplies}
                                onShowAuth={onShowAuth}
                                onToggleReaction={onToggleReaction}
                                canDelete={canDelete}
                                canReport={canReport}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
