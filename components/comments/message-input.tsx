"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, Loader2 } from "lucide-react"
import { PHOTO_UPLOAD_ENABLED } from "@/lib/feature-flags"

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
}: MessageInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dismissed, setDismissed] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onImageSelect(file)
        }
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
        if (e.key === "Escape" && onCancel) {
            onCancel()
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
                    autoFocus={mode === "reply"}
                    value={value}
                    onChange={(e) => {
                        if (e.target.value.length <= charLimit) {
                            onChange(e.target.value)
                        }
                    }}
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

                {/* Banner — inside container, attached */}
                {mode === "comment" && !dismissed && (
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-t border-border/30 bg-muted/40">
                        <span className="text-[12px] text-muted-foreground/60 leading-tight">
                            Saygılı ve yapıcı olun, uygunsuz içerikleri raporlayın.
                        </span>
                        <button
                            onClick={() => setDismissed(true)}
                            className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
