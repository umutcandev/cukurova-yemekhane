"use client"

import { useState } from "react"
import type { Session } from "next-auth"
import { SmilePlus } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { COMMENT_EMOJIS } from "@/lib/emoji-constants"

interface EmojiReactionPickerProps {
    commentId: number
    session: Session | null
    isMobile: boolean
    onToggleReaction: (commentId: number, emoji: string) => void
    onShowAuth: () => void
}

export function EmojiReactionPicker({
    commentId,
    session,
    isMobile,
    onToggleReaction,
    onShowAuth,
}: EmojiReactionPickerProps) {
    const [open, setOpen] = useState(false)

    const handleToggle = () => {
        if (!session) {
            onShowAuth()
            return
        }
        setOpen(!open)
    }

    const handleSelect = (emojiKey: string) => {
        onToggleReaction(commentId, emojiKey)
        setOpen(false)
    }

    if (isMobile) {
        return (
            <div className="relative inline-flex items-center">
                <button
                    className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground/60 hover:text-primary"
                    onClick={handleToggle}
                >
                    <SmilePlus className="h-3.5 w-3.5" />
                </button>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <div className="absolute left-0 bottom-full mb-1 z-50 bg-popover border border-border rounded-md shadow-md p-1">
                            <div className="flex gap-0.5">
                                {COMMENT_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji.key}
                                        onClick={() => handleSelect(emoji.key)}
                                        className="flex items-center justify-center w-8 h-8 rounded hover:bg-muted active:bg-muted transition-colors text-lg"
                                        title={emoji.label}
                                    >
                                        {emoji.native}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <Popover open={open} onOpenChange={(val) => {
            if (!session && val) {
                onShowAuth()
                return
            }
            setOpen(val)
        }}>
            <PopoverTrigger asChild>
                <button
                    className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground/60 hover:text-primary"
                >
                    <SmilePlus className="h-3.5 w-3.5" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                sideOffset={2}
                className="w-auto p-1 border border-border shadow-md"
            >
                <div className="flex gap-0.5">
                    {COMMENT_EMOJIS.map((emoji) => (
                        <button
                            key={emoji.key}
                            onClick={() => handleSelect(emoji.key)}
                            className="flex items-center justify-center w-7 h-7 rounded hover:bg-muted transition-colors text-base"
                            title={emoji.label}
                        >
                            {emoji.native}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
