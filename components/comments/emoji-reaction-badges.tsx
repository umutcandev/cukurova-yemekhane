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
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none select-none transition-colors border flex-shrink-0 ${
                            isOwn
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-muted/60 border-border/20 text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        <span className="text-[11px] leading-none">{getEmojiNative(key)}</span>
                        <span className="leading-none">{reactions[key]}</span>
                    </button>
                )
            })}
        </>
    )
}
