"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bookmark, Trash2, ArrowLeft, Loader2, Mail, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { toTitleCase } from "@/lib/utils"
import { Header } from "@/components/header"
import { MealDetailModal } from "@/components/meal-detail-modal"

interface FavoriteItem {
    mealName: string
    mealId: string | null
}

export default function FavorilerimPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [favorites, setFavorites] = useState<FavoriteItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [notifyFavorites, setNotifyFavorites] = useState(false)
    const [isTogglingNotify, setIsTogglingNotify] = useState(false)
    const [selectedMeal, setSelectedMeal] = useState<{ id: string; name: string } | null>(null)

    useEffect(() => {
        if (session?.user) {
            fetchFavorites()
            fetchEmailPreference()
        }
    }, [session?.user])

    const fetchFavorites = async () => {
        try {
            setIsLoading(true)
            const res = await fetch("/api/favorites")
            if (res.ok) {
                const data = await res.json()
                setFavorites(data.favorites || [])
            }
        } catch (error) {
            console.error("Failed to fetch favorites:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchEmailPreference = async () => {
        try {
            const res = await fetch("/api/email-preferences")
            if (res.ok) {
                const data = await res.json()
                setNotifyFavorites(data.notifyFavorites || false)
            }
        } catch (error) {
            console.error("Failed to fetch email preference:", error)
        }
    }

    const handleToggleNotify = async (checked: boolean) => {
        setIsTogglingNotify(true)
        setNotifyFavorites(checked)

        try {
            const res = await fetch("/api/email-preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notifyFavorites: checked }),
            })

            if (res.ok) {
                toast.success(
                    checked
                        ? "E-posta bildirimleri açıldı"
                        : "E-posta bildirimleri kapatıldı",
                    { duration: 2000 }
                )
            } else {
                setNotifyFavorites(!checked)
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        } catch {
            setNotifyFavorites(!checked)
            toast.error("Bir hata oluştu", { duration: 2000 })
        } finally {
            setIsTogglingNotify(false)
        }
    }

    const handleRemoveFavorite = async (mealName: string) => {
        // Optimistic update
        setFavorites(prev => prev.filter(f => f.mealName !== mealName))

        try {
            const res = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mealName }),
            })

            if (res.ok) {
                toast.success(`${mealName} favorilerden çıkarıldı`, { duration: 2000 })
            } else {
                // Rollback
                setFavorites(prev => [...prev, { mealName, mealId: null }])
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        } catch {
            // Rollback
            setFavorites(prev => [...prev, { mealName, mealId: null }])
            toast.error("Bir hata oluştu", { duration: 2000 })
        }
    }

    const handleShowDetail = (fav: FavoriteItem) => {
        if (fav.mealId) {
            setSelectedMeal({ id: fav.mealId, name: fav.mealName })
        } else {
            // mealId yoksa mealName'den türetelim (mealName'in lowercase + kebab-case hali)
            const generatedId = fav.mealName.toLowerCase().replace(/\s+/g, "-")
            setSelectedMeal({ id: generatedId, name: fav.mealName })
        }
    }

    if (status === "loading" || (status === "authenticated" && isLoading)) {
        return (
            <main className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <Header />

            <div className="container mx-auto px-4 py-6 md:py-8 max-w-md">
                {/* Back button + Title */}
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => router.push("/")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">
                            Favorilerim
                        </h1>
                    </div>
                </div>

                {/* Email Notification Opt-in */}
                {favorites.length > 0 && (
                    <Card className="border border-border/40 bg-card p-3 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md bg-muted/50 flex-shrink-0 mt-0.5">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-foreground">
                                        E-posta Bildirimi
                                    </p>
                                    <Switch
                                        checked={notifyFavorites}
                                        onCheckedChange={handleToggleNotify}
                                        disabled={isTogglingNotify}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Favori yemeğiniz menüde olduğunda e-posta{session?.user?.email ? ` (${session.user.email})` : ""} ile bilgilendirilirsiniz.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Favorites List */}
                {favorites.length === 0 ? (
                    <Card className="border border-border/40 bg-card p-8 text-center">
                        <Bookmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Henüz favori yemeğiniz yok. Hemen favori yemeğinizi ekleyin!
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => router.push("/")}
                        >
                            Menüye Dön
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {favorites.map((fav) => (
                            <Card
                                key={fav.mealName}
                                className="border border-border/40 bg-card px-3 py-2.5 flex flex-row items-center justify-between gap-3"
                            >
                                <span className="text-sm font-medium text-foreground truncate min-w-0">
                                    {toTitleCase(fav.mealName)}
                                </span>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleShowDetail(fav)}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleRemoveFavorite(fav.mealName)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Meal Detail Modal */}
            {selectedMeal && (
                <MealDetailModal
                    mealId={selectedMeal.id}
                    mealName={selectedMeal.name}
                    mealCalories={0}
                    open={!!selectedMeal}
                    onOpenChange={(open) => {
                        if (!open) setSelectedMeal(null)
                    }}
                />
            )}
        </main>
    )
}

