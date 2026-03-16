"use client"

import { Button } from "@/components/ui/button"

interface ReplyInputProps {
    value: string
    onChange: (val: string) => void
    onSend: () => void
    onCancel: () => void
    sending: boolean
    charLimit: number
}

export function ReplyInput({ value, onChange, onSend, onCancel, sending, charLimit }: ReplyInputProps) {
    return (
        <div className="mt-1.5 flex items-stretch gap-2" style={{ height: "34px" }}>
            <div className="relative flex-1 h-full">
                <textarea
                    autoFocus
                    value={value}
                    onChange={(e) => {
                        if (e.target.value.length <= charLimit) onChange(e.target.value)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            onSend()
                        }
                        if (e.key === "Escape") onCancel()
                    }}
                    placeholder="Yanıtınızı yazın..."
                    maxLength={charLimit}
                    rows={1}
                    className="w-full h-full resize-none bg-muted/50 border border-border/40 rounded-lg pl-3 pr-14 py-0 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring overflow-hidden"
                    style={{ lineHeight: "34px" }}
                />
                <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded-md ${value.length >= charLimit ? "bg-destructive/10 text-destructive" : value.length >= charLimit * 0.8 ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground/50"}`}>
                    {value.length}/{charLimit}
                </span>
            </div>
            <Button
                size="sm"
                onClick={onSend}
                disabled={sending || !value.trim()}
                className="h-full px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shrink-0 min-w-[60px]"
            >
                {sending ? (
                    <span className="flex items-center gap-[3px]">
                        <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                ) : "Gönder"}
            </Button>
        </div>
    )
}
