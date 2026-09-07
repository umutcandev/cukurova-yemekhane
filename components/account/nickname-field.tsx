"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const NICKNAME_REGEX = /^[\p{L}\p{N}_.\-]+(?: [\p{L}\p{N}_.\-]+)*$/u

interface NicknameFieldProps {
    initialNickname: string | null
    fallbackName: string | null
    onSaved: (nickname: string | null) => void
}

export function NicknameField({ initialNickname, fallbackName, onSaved }: NicknameFieldProps) {
    const [value, setValue] = useState(initialNickname ?? "")
    const [isSaving, setIsSaving] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const validate = (v: string): string | null => {
        const trimmed = v.trim()
        if (trimmed.length < 2) return "Takma ad en az 2 karakter olmalıdır."
        if (trimmed.length > 24) return "Takma ad en fazla 24 karakter olabilir."
        if (!NICKNAME_REGEX.test(trimmed)) {
            return "Takma ad sadece harf, rakam, _ . - ve tek boşluk içerebilir."
        }
        return null
    }

    const handleSave = async () => {
        const trimmed = value.trim()
        const validationError = validate(trimmed)
        if (validationError) {
            setError(validationError)
            return
        }

        setError(null)
        setIsSaving(true)
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname: trimmed }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Takma ad kaydedilemedi.")
            }

            onSaved(trimmed)
            toast.success("Takma ad güncellendi.")
        } catch (err) {
            const message = err instanceof Error ? err.message : "Takma ad kaydedilemedi."
            setError(message)
            toast.error(message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemove = async () => {
        setError(null)
        setIsRemoving(true)
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname: null }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Takma ad kaldırılamadı.")
            }

            setValue("")
            onSaved(null)
            toast.success("Takma ad kaldırıldı.")
        } catch (err) {
            const message = err instanceof Error ? err.message : "Takma ad kaldırılamadı."
            setError(message)
            toast.error(message)
        } finally {
            setIsRemoving(false)
        }
    }

    const trimmed = value.trim()
    const isUnchanged = trimmed === (initialNickname ?? "")
    const canSave = trimmed.length > 0 && !isUnchanged && !isSaving && !isRemoving

    return (
        <div className="rounded-xl ring-1 ring-foreground/10 bg-card overflow-hidden">
            {/* Body — profil fotoğrafı kartıyla aynı ritim: metin solda,
                kontrol sağda ve metin bloğuyla dikey ortalı. */}
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                {/* Boşluk TEK yerde: space-y-2. Daha önce hem space-y-1 hem de
                    p üzerinde mt-2 vardı; kardeş marjları çakıştığı için gerçek
                    aralığı mt-2 veriyor, space-y-1 hiçbir şey yapmıyordu.
                    text-md ise Tailwind'de yok — başlık 16px'i body'den miras
                    alıyordu, artık text-base ile açıkça söyleniyor. */}
                <div className="min-w-0 space-y-2">
                    <h3 className="text-base font-semibold text-foreground leading-none">
                        Takma Ad
                    </h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                        Google adınız yerine takma ad kullanın.
                    </p>
                </div>

                <Input
                    id="nickname"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        if (error) setError(null)
                    }}
                    placeholder={fallbackName ?? "Takma adınızı girin"}
                    maxLength={24}
                    disabled={isSaving || isRemoving}
                    className="h-9 w-full shrink-0 sm:w-56"
                />
            </div>

            {/* Footer — yüksekliği buton belirliyor: h-7 + py-1.5 = 40px. */}
            <div className="flex items-center justify-between gap-4 border-t border-border/40 bg-muted/50 px-4 py-1.5 sm:px-5">
                <div className="flex-1 min-w-0">
                    {error ? (
                        <p className="text-xs text-destructive">{error}</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            En fazla 24 karakter.
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {initialNickname && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            onClick={handleRemove}
                            disabled={isSaving || isRemoving}
                        >
                            {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Kaldır"}
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={handleSave}
                        disabled={!canSave}
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Kaydet"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
