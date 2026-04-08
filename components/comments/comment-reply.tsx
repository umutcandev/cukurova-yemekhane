"use client"

import type { Session } from "next-auth"
import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CommentActionMenu } from "./comment-action-menu"
import { EmojiReactionPicker } from "./emoji-reaction-picker"
import { EmojiReactionBadges } from "./emoji-reaction-badges"
import { MessageInput } from "./message-input"
import { useReplyImage } from "./reply-image-context"
import { formatRelativeTime, getInitials } from "./utils"
import { MentionText } from "./mention-text"
import { CHAR_LIMIT } from "./types"
import type { Comment, Reply } from "./types"

interface CommentReplyProps {
    reply: Reply
    parentId: number
    commentsDisabled: boolean
    replyingToId: number | null
    expandedComments: Set<number>
    session: Session | null
    isMobile: boolean
    openMenuId: number | null
    sendingReply: boolean
    replyContent: string
    onReplyContentChange: (val: string) => void
    onSetReplyingTo: (id: number | null) => void
    onSendReply: (parentId: number) => void
    onOpenMenuChange: (id: number | null) => void
    onReport: (comment: Comment | Reply) => void
    onDelete: (id: number) => void
    onToggleExpand: (id: number) => void
    onShowAuth: () => void
    onToggleReaction: (commentId: number, emoji: string) => void
    canDelete: (comment: Comment | Reply) => boolean
    canReport: (comment: Comment | Reply) => boolean
    onReplyMentionAdd?: (user: { id: string }) => void
}

export function CommentReply({
    reply,
    parentId,
    commentsDisabled,
    replyingToId,
    expandedComments,
    session,
    isMobile,
    openMenuId,
    sendingReply,
    replyContent,
    onReplyContentChange,
    onSetReplyingTo,
    onSendReply,
    onOpenMenuChange,
    onReport,
    onDelete,
    onToggleExpand,
    onShowAuth,
    onToggleReaction,
    canDelete,
    canReport,
    onReplyMentionAdd,
}: CommentReplyProps) {
    const { replyImagePreview, replyImageFile, replyImageLoading, onReplyImageSelect, onReplyImageClear } = useReplyImage()

    return (
        <div key={reply.id} className="flex items-start gap-2 py-1">
            <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                {reply.userImage && (
                    <AvatarImage
                        src={reply.userImage}
                        alt={reply.userName || "Kullanıcı"}
                    />
                )}
                <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                    {getInitials(reply.userName)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">
                            {reply.userName || "Anonim"}
                        </span>
                        <span className="text-xs text-muted-foreground/60 shrink-0">
                            {formatRelativeTime(reply.createdAt)}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground/60 bg-muted/80 border border-border/40 px-1.5 py-0.5 rounded-sm shrink-0 leading-none select-none">
                            #{reply.id}
                        </span>
                    </div>
                    <CommentActionMenu
                        comment={reply}
                        isMobile={isMobile}
                        openMenuId={openMenuId}
                        onOpenMenuChange={onOpenMenuChange}
                        onReport={onReport}
                        onDelete={onDelete}
                        canDelete={canDelete(reply)}
                        canReport={canReport(reply)}
                    />
                </div>

                {/* Inline image */}
                {reply.imageUrl && (
                    <div className="mt-1 mb-1">
                        <Image
                            src={reply.imageUrl}
                            alt="Yanıt fotoğrafı"
                            width={200}
                            height={150}
                            className="rounded-lg object-cover max-w-full border border-border/40"
                            style={{ maxWidth: 200, height: "auto" }}
                        />
                    </div>
                )}

                {reply.content && (
                    <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed break-words">
                        <MentionText text={reply.content} />
                    </p>
                )}
<div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {!commentsDisabled && (
                        <button
                            onClick={() => {
                                if (!session) { onShowAuth(); return }
                                if (replyingToId === reply.id) {
                                    onSetReplyingTo(null)
                                } else {
                                    onSetReplyingTo(reply.id)
                                    onReplyContentChange(`@${reply.userName || "Anonim"} `)
                                }
                            }}
                            className="text-xs text-muted-foreground/60 hover:text-primary transition-colors font-medium"
                        >
                            Yanıtla
                        </button>
                    )}
                    <EmojiReactionPicker
                        commentId={reply.id}
                        session={session}
                        isMobile={isMobile}
                        onToggleReaction={onToggleReaction}
                        onShowAuth={onShowAuth}
                    />
                    <EmojiReactionBadges
                        commentId={reply.id}
                        reactions={reply.reactions}
                        userReaction={reply.userReaction}
                        session={session}
                        onToggleReaction={onToggleReaction}
                        onShowAuth={onShowAuth}
                    />
                </div>

                {/* Inline reply form — targets the parent comment */}
                {replyingToId === reply.id && !commentsDisabled && (
                    <MessageInput
                        mode="reply"
                        value={replyContent}
                        onChange={onReplyContentChange}
                        onSend={() => onSendReply(parentId)}
                        onCancel={() => onSetReplyingTo(null)}
                        sending={sendingReply}
                        charLimit={CHAR_LIMIT}
                        imagePreview={replyImagePreview}
                        imageFile={replyImageFile}
                        onImageSelect={onReplyImageSelect}
                        onImageClear={onReplyImageClear}
                        imageLoading={replyImageLoading}
                        onMentionAdd={onReplyMentionAdd}
                        isMobile={isMobile}
                    />
                )}
            </div>
        </div>
    )
}
