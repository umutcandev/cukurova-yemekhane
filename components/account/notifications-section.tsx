"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { LOW_CALORIE_THRESHOLD } from "@/lib/constants"

interface NotificationsSectionProps {
    notifyFavorites: boolean
    excludeLowCalorie: boolean
    onChange: (next: { notifyFavorites: boolean; excludeLowCalorie: boolean }) => void
}

type PrefsBody = Partial<{ notifyFavorites: boolean; excludeLowCalorie: boolean }>

export function NotificationsSection({
    notifyFavorites,
    excludeLowCalorie,
    onChange,
}: NotificationsSectionProps) {
    const [isTogglingNotify, setIsTogglingNotify] = useState(false)
    const [isTogglingExclude, setIsTogglingExclude] = useState(false)

    const patch = async (
        body: PrefsBody,
        setLoading: (v: boolean) => void,
        successMsg: string
    ) => {
        setLoading(true)
        try {
            const res = await fetch("/api/email-preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Ayar güncellenemedi.")
            }
            onChange({
                notifyFavorites: !!data.notifyFavorites,
                excludeLowCalorie: !!data.excludeLowCalorie,
            })
            toast.success(successMsg)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Ayar güncellenemedi.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Bildirimler</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    E-posta bildirim tercihlerinizi yönetin.
                </p>
            </div>

            <Card className="bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                            Favori yemek e-posta bildirimi
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Favori yemeğiniz menüde olduğunda e-posta ile bilgilendirilirsiniz.
                        </p>
                    </div>
                    <Switch
                        checked={notifyFavorites}
                        onCheckedChange={(v) =>
                            patch(
                                { notifyFavorites: v },
                                setIsTogglingNotify,
                                v ? "Bildirimler açıldı." : "Bildirimler kapatıldı."
                            )
                        }
                        disabled={isTogglingNotify}
                    />
                </div>
            </Card>

            {notifyFavorites && (
                <Card className="bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                                Düşük kalorili yemekleri bildirme
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Kalorisi {LOW_CALORIE_THRESHOLD}&apos;den az olan favori yemekler için e-posta gönderilmez.
                            </p>
                        </div>
                        <Switch
                            checked={excludeLowCalorie}
                            onCheckedChange={(v) =>
                                patch(
                                    { excludeLowCalorie: v },
                                    setIsTogglingExclude,
                                    v
                                        ? "Düşük kalori filtresi açıldı."
                                        : "Düşük kalori filtresi kapatıldı."
                                )
                            }
                            disabled={isTogglingExclude}
                        />
                    </div>
                </Card>
            )}
        </section>
    )
}
