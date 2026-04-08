"use client"

import { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, Loader2 } from "lucide-react"
import { PHOTO_UPLOAD_ENABLED } from "@/lib/feature-flags"
import { MentionPopover } from "./mention-popover"

interface MessageInputProps {
    mode: "comment" | "reply"
    value: string
    onChange: (val: string) => void
    onSend: () => void
    sending: boolean
    charLimit: number
    imagePreview: string | null
    imageFile: File | null
    onImageSelect: (file: File) => void
    onImageClear: () => void
    imageLoading?: boolean
    onCancel?: () => void
    className?: string
    onMentionAdd?: (user: { id: string; name: string | null; image: string | null }) => void
    isMobile?: boolean
}

export function MessageInput({
    mode,
    value,
    onChange,
    onSend,
    sending,
    charLimit,
    imagePreview,
    imageFile,
    onImageSelect,
    onImageClear,
    imageLoading = false,
    onCancel,
    className,
    onMentionAdd,
    isMobile = false,
}: MessageInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [mentionQuery, setMentionQuery] = useState("")
    const [mentionVisible, setMentionVisible] = useState(false)

    // Refs to avoid stale closures in handleMentionSelect — prevents re-creating callback on every keystroke
    const valueRef = useRef(value)
    valueRef.current = value
    const mentionQueryRef = useRef(mentionQuery)
    mentionQueryRef.current = mentionQuery

    const handleMentionSelect = useCallback((user: { id: string; name: string | null; image: string | null }) => {
        const name = (user.name || "Anonim").replace(/ /g, "\u00A0")
        // Find the last @ + query in the value and replace it with @Name
        // Non-breaking spaces keep multi-word names as a single token for badge rendering
        const currentValue = valueRef.current
        const currentQuery = mentionQueryRef.current
        const atIndex = currentValue.lastIndexOf("@" + currentQuery)
        if (atIndex !== -1) {
            const before = currentValue.slice(0, atIndex)
            const after = currentValue.slice(atIndex + 1 + currentQuery.length)
            const newValue = before + "@" + name + " " + after
            if (newValue.length <= charLimit) {
                onChange(newValue)
            }
        }
        onMentionAdd?.(user)
        setMentionVisible(false)
        setMentionQuery("")
        textareaRef.current?.focus()
    }, [onChange, charLimit, onMentionAdd])

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        if (newValue.length <= charLimit) {
            onChange(newValue)
        }

        // Detect @ mention pattern
        const cursorPos = e.target.selectionStart || 0
        const textBeforeCursor = newValue.slice(0, cursorPos)
        const atMatch = textBeforeCursor.match(/@(\S{0,20})$/)
        if (atMatch) {
            const query = atMatch[1]
            setMentionQuery(query)
            setMentionVisible(query.length >= 3)
        } else {
            setMentionVisible(false)
            setMentionQuery("")
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onImageSelect(file)
        }
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Mention popover açıkken keyboard olaylarını popover yönetir
        if (mentionVisible && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
            return
        }
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
        if (e.key === "Escape") {
            if (mentionVisible) {
                setMentionVisible(false)
            } else if (onCancel) {
                onCancel()
            }
        }
    }

    const hasContent = value.trim().length > 0 || !!imageFile
    const showImageChip = imageLoading || imagePreview || imageFile
    const fileName = imageFile?.name || "Yükleniyor..."

    const wrapperClass = className ?? (
        mode === "comment"
            ? "border-t border-border/40 px-3 py-2.5 shrink-0"
            : "mt-1.5"
    )

    return (
        <div className={wrapperClass}>
            <div className="relative">
                {/* Mention popover — outside overflow-hidden container */}
                <MentionPopover
                    query={mentionQuery}
                    visible={mentionVisible}
                    onSelect={handleMentionSelect}
                    onClose={() => setMentionVisible(false)}
                    isMobile={isMobile}
                />

                <div className="rounded-xl border border-border/40 bg-muted/30 overflow-hidden">
                    {/* Image chip */}
                    {showImageChip && (
                        <div className="px-3 pt-2.5 pb-0">
                            <div className="inline-flex items-center gap-1.5 bg-muted border border-border/40 rounded-full px-2.5 py-1 text-xs text-muted-foreground max-w-[220px]">
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="truncate">{fileName}</span>
                                {imageLoading ? (
                                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                ) : (
                                    <button
                                        onClick={onImageClear}
                                        className="shrink-0 hover:text-destructive transition-colors"
                                        type="button"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        autoFocus={mode === "reply"}
                        value={value}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder={mode === "comment" ? "Mesajınızı yazınız..." : "Yanıtınızı yazınız..."}
                        maxLength={charLimit}
                        rows={2}
                        className="w-full resize-none bg-transparent px-3 pt-2.5 pb-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none"
                    />

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-3 pb-2.5">
                    {/* Left: image upload */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {PHOTO_UPLOAD_ENABLED && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending || imageLoading}
                                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-primary gap-1.5"
                            >
                                <Paperclip className="h-3.5 w-3.5" />
                                Resim yükle
                            </Button>
                        )}
                    </div>

                    {/* Right: char counter + send button */}
                    <div className="flex items-center gap-3">
                        <span className={`text-[11px] tabular-nums ${
                            value.length >= charLimit
                                ? "text-destructive"
                                : value.length >= charLimit * 0.8
                                    ? "text-amber-500"
                                    : "text-muted-foreground/40"
                        }`}>
                            {value.length}/{charLimit}
                        </span>
                        <Button
                            size="sm"
                            onClick={onSend}
                            disabled={sending || imageLoading || !hasContent}
                            className="h-7 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg"
                        >
                            {(sending || imageLoading) ? (
                                <span className="flex items-center gap-[3px]">
                                    <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                                </span>
                            ) : "Gönder"}
                        </Button>
                    </div>
                </div>

                </div>
            </div>
        </div>
    )
}
