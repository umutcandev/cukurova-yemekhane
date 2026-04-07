"use client"

import type { Session } from "next-auth"
import { getEmojiNative, COMMENT_EMOJIS } from "@/lib/emoji-constants"

interface EmojiReactionBadgesProps {
    commentId: number
    reactions: Record<string, number>
    userReaction: string | null
    session: Session | null
    onToggleReaction: (commentId: number, emoji: string) => void
    onShowAuth: () => void
}

export function EmojiReactionBadges({
    commentId,
    reactions,
    userReaction,
    session,
    onToggleReaction,
    onShowAuth,
}: EmojiReactionBadgesProps) {
    const emojiKeys = Object.keys(reactions).filter((k) => reactions[k] > 0)
    if (emojiKeys.length === 0) return null

    // Sort by the order defined in COMMENT_EMOJIS
    const order: string[] = COMMENT_EMOJIS.map((e) => e.key)
    const sorted = emojiKeys.sort((a, b) => order.indexOf(a) - order.indexOf(b))

    return (
        <>
            {sorted.map((key) => {
                const isOwn = userReaction === key
                return (
                    <button
                        key={key}
                        onClick={() => {
                            if (!session) {
                                onShowAuth()
                                return
                            }
                            onToggleReaction(commentId, key)
                        }}
                        className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-sm leading-none select-none transition-colors border ${
                            isOwn
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-muted/80 border-border/40 text-muted-foreground/60 hover:bg-muted"
                        }`}
                    >
                        <span className="text-xs leading-none">{getEmojiNative(key)}</span>
                        <span className="leading-none">{reactions[key]}</span>
                    </button>
                )
            })}
        </>
    )
}
