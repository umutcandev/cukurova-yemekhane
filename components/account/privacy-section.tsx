"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

interface PrivacySectionProps {
    isHidden: boolean
    onChange: (hidden: boolean) => void
}

export function PrivacySection({ isHidden, onChange }: PrivacySectionProps) {
    const [isToggling, setIsToggling] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setIsToggling(true)
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hideProfilePicture: checked }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Ayar güncellenemedi.")
            }
            onChange(checked)
            toast.success(
                checked
                    ? "Profil fotoğrafınız diğer kullanıcılardan gizlendi."
                    : "Profil fotoğrafınız tekrar görünür."
            )
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Ayar güncellenemedi.")
        } finally {
            setIsToggling(false)
        }
    }

    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Gizlilik</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Hesabınızın gizlilik tercihlerini yönetin.
                </p>
            </div>
            <Card className="bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                            Profil fotoğrafımı herkese gizle
                        </p>
                    </div>
                    <Switch
                        checked={isHidden}
                        onCheckedChange={handleToggle}
                        disabled={isToggling}
                    />
                </div>
            </Card>
        </section>
    )
}
