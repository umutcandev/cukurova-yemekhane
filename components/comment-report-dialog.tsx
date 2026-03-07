"use client"

import { useState } from "react"
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
import { toast } from "sonner"

interface CommentForReport {
    id: number
    userName: string | null
    content: string
}

const REPORT_REASONS = [
    "Hakaret / Küfür içeriyor",
    "Spam / Reklam",
    "Yanıltıcı bilgi",
    "Uygunsuz içerik",
    "Diğer",
]

interface CommentReportDialogProps {
    comment: CommentForReport | null
    onClose: () => void
}

export function CommentReportDialog({ comment, onClose }: CommentReportDialogProps) {
    const [selectedReason, setSelectedReason] = useState<string>("")
    const [customReason, setCustomReason] = useState("")
    const [sending, setSending] = useState(false)

    const handleSubmit = async () => {
        if (!comment) return

        const reason = selectedReason === "Diğer" ? customReason.trim() : selectedReason
        if (!reason) {
            toast.error("Lütfen bir rapor sebebi seçin.", { duration: 2000 })
            return
        }

        setSending(true)
        try {
            const res = await fetch("/api/comments/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId: comment.id, reason }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Rapor gönderilemedi.", { duration: 3000 })
            } else {
                toast.success("Rapor başarıyla gönderildi. Teşekkürler!", { duration: 3000 })
            }
        } catch {
            toast.error("Bir hata oluştu.", { duration: 2000 })
        } finally {
            setSending(false)
            setSelectedReason("")
            setCustomReason("")
            onClose()
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedReason("")
            setCustomReason("")
            onClose()
        }
    }

    return (
        <AlertDialog open={!!comment} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-[360px] sm:max-w-md p-4 gap-3">
                <AlertDialogHeader className="gap-1">
                    <AlertDialogTitle>Yorumu Raporla</AlertDialogTitle>
                    <AlertDialogDescription>
                        <span className="font-medium text-foreground">{comment?.userName || "Anonim"}</span> kullanıcısının yorumunu raporlamak üzeresiniz.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground mb-2">Rapor sebebinizi seçin:</p>
                    {REPORT_REASONS.map((reason) => (
                        <label
                            key={reason}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${selectedReason === reason
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border/40 hover:bg-muted/50 text-muted-foreground"
                                }`}
                        >
                            <input
                                type="radio"
                                name="report-reason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={() => setSelectedReason(reason)}
                                className="accent-primary"
                            />
                            {reason}
                        </label>
                    ))}

                    {selectedReason === "Diğer" && (
                        <textarea
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Sebebinizi açıklayın..."
                            maxLength={200}
                            rows={2}
                            className="w-full mt-2 resize-none bg-muted/50 border border-border/40 rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={sending}>Vazgeç</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleSubmit()
                        }}
                        disabled={sending || !selectedReason || (selectedReason === "Diğer" && !customReason.trim())}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        {sending ? "Gönderiliyor..." : "Raporla"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
