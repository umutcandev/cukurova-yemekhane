"use client"

import type { Session } from "next-auth"
import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CommentActionMenu } from "./comment-action-menu"
import { CommentReply } from "./comment-reply"
import { MessageInput } from "./message-input"
import { useReplyImage } from "./reply-image-context"
import { formatRelativeTime, getInitials } from "./utils"
import { CHAR_LIMIT } from "./types"
import type { Comment, Reply } from "./types"

interface CommentItemProps {
    comment: Comment
    commentsDisabled: boolean
    expandedComments: Set<number>
    expandedReplies: Set<number>
    replyingToId: number | null
    replyContent: string
    session: Session | null
    isMobile: boolean
    openMenuId: number | null
    sendingReply: boolean
    onReplyContentChange: (val: string) => void
    onSetReplyingTo: (id: number | null) => void
    onSendReply: (parentId: number) => void
    onOpenMenuChange: (id: number | null) => void
    onReport: (comment: Comment | Reply) => void
    onDelete: (id: number) => void
    onToggleExpand: (id: number) => void
    onToggleReplies: (id: number) => void
    onShowAuth: () => void
    canDelete: (comment: Comment | Reply) => boolean
    canReport: (comment: Comment | Reply) => boolean
}

export function CommentItem({
    comment,
    commentsDisabled,
    expandedComments,
    expandedReplies,
    replyingToId,
    replyContent,
    session,
    isMobile,
    openMenuId,
    sendingReply,
    onReplyContentChange,
    onSetReplyingTo,
    onSendReply,
    onOpenMenuChange,
    onReport,
    onDelete,
    onToggleExpand,
    onToggleReplies,
    onShowAuth,
    canDelete,
    canReport,
}: CommentItemProps) {
    const { replyImagePreview, replyImageFile, replyImageLoading, onReplyImageSelect, onReplyImageClear } = useReplyImage()
    const MAX_CHARS = 100
    const isLong = comment.content.length > MAX_CHARS
    const isExpanded = expandedComments.has(comment.id)
    const displayText = isLong && !isExpanded
        ? comment.content.slice(0, MAX_CHARS) + "..."
        : comment.content

    return (
        <div className="py-1.5">
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
                            <span className="text-[10px] font-mono font-medium text-muted-foreground/60 bg-muted/80 border border-border/40 px-1.5 py-0.5 rounded-sm shrink-0 leading-none select-none">
                                #{comment.id}
                            </span>
                        </div>
                        <CommentActionMenu
                            comment={comment}
                            isMobile={isMobile}
                            openMenuId={openMenuId}
                            onOpenMenuChange={onOpenMenuChange}
                            onReport={onReport}
                            onDelete={onDelete}
                            canDelete={canDelete(comment)}
                            canReport={canReport(comment)}
                        />
                    </div>

                    {/* Inline image */}
                    {comment.imageUrl && (
                        <div className="mt-1.5 mb-1">
                            <Image
                                src={comment.imageUrl}
                                alt="Yorum fotoğrafı"
                                width={240}
                                height={180}
                                className="rounded-lg object-cover max-w-full border border-border/40"
                                style={{ maxWidth: 240, height: "auto" }}
                            />
                        </div>
                    )}

                    {comment.content && (
                        <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed break-words">
                            {displayText}
                        </p>
                    )}
                    {isLong && (
                        <button
                            onClick={() => onToggleExpand(comment.id)}
                            className="text-xs text-primary hover:underline mt-0.5"
                        >
                            {isExpanded ? "daha az göster" : "devamını göster"}
                        </button>
                    )}

                    {/* Yanıtla butonu */}
                    {!commentsDisabled && (
                        <div className="flex items-center gap-3 mt-1">
                            <button
                                onClick={() => {
                                    if (!session) { onShowAuth(); return }
                                    if (replyingToId === comment.id) {
                                        onSetReplyingTo(null)
                                    } else {
                                        onSetReplyingTo(comment.id)
                                        onReplyContentChange("")
                                    }
                                }}
                                className="text-xs text-muted-foreground/60 hover:text-primary transition-colors font-medium"
                            >
                                Yanıtla
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Replies — collapsed by default */}
            {comment.replies.length > 0 && (
                !expandedReplies.has(comment.id) ? (
                    <button
                        onClick={() => onToggleReplies(comment.id)}
                        className="ml-15 mt-1 text-xs text-muted-foreground/60 hover:text-primary transition-colors font-medium"
                    >
                        Diğer yanıtı gör ({comment.replies.length})
                    </button>
                ) : (
                    <div className="ml-10 mt-1.5">
                        <div className="space-y-0.5">
                            {comment.replies.map((reply) => (
                                <CommentReply
                                    key={reply.id}
                                    reply={reply}
                                    parentId={comment.id}
                                    commentsDisabled={commentsDisabled}
                                    replyingToId={replyingToId}
                                    expandedComments={expandedComments}
                                    session={session}
                                    isMobile={isMobile}
                                    openMenuId={openMenuId}
                                    sendingReply={sendingReply}
                                    replyContent={replyContent}
                                    onReplyContentChange={onReplyContentChange}
                                    onSetReplyingTo={onSetReplyingTo}
                                    onSendReply={onSendReply}
                                    onOpenMenuChange={onOpenMenuChange}
                                    onReport={onReport}
                                    onDelete={onDelete}
                                    onToggleExpand={onToggleExpand}
                                    onShowAuth={onShowAuth}
                                    canDelete={canDelete}
                                    canReport={canReport}
                                />
                            ))}
                        </div>
                    </div>
                )
            )}

            {/* Inline reply form (parent comment için) */}
            {replyingToId === comment.id && !commentsDisabled && (
                <div className="ml-10">
                    <MessageInput
                        mode="reply"
                        value={replyContent}
                        onChange={onReplyContentChange}
                        onSend={() => onSendReply(comment.id)}
                        onCancel={() => onSetReplyingTo(null)}
                        sending={sendingReply}
                        charLimit={CHAR_LIMIT}
                        imagePreview={replyImagePreview}
                        imageFile={replyImageFile}
                        onImageSelect={onReplyImageSelect}
                        onImageClear={onReplyImageClear}
                        imageLoading={replyImageLoading}
                    />
                </div>
            )}
        </div>
    )
}
