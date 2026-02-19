"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Heart, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { toTitleCase } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { InfoDialog } from "@/components/info-dialog"
import { AuthButton } from "@/components/auth-button"

interface FavoriteItem {
    mealName: string
}

export default function FavorilerimPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [favorites, setFavorites] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (session?.user) {
            fetchFavorites()
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

    const handleRemoveFavorite = async (mealName: string) => {
        // Optimistic update
        setFavorites(prev => prev.filter(f => f !== mealName))

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
                setFavorites(prev => [...prev, mealName])
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        } catch {
            // Rollback
            setFavorites(prev => [...prev, mealName])
            toast.error("Bir hata oluştu", { duration: 2000 })
        }
    }

    if (status === "loading" || (status === "authenticated" && isLoading)) {
        return (
            <main className="min-h-screen bg-background">
                <header className="dark text-foreground sticky top-0 z-50 border-b border-border bg-background">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="relative h-9 w-40 md:w-48">
                                <Image src="/logo-cu.png" alt="ÇÜ Yemekhane" fill className="object-contain object-left" priority />
                            </div>
                            <div className="flex items-center gap-2">
                                <InfoDialog />
                                <AuthButton />
                                <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </header>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <header className="dark text-foreground sticky top-0 z-50 border-b border-border bg-background">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="relative h-9 w-40 md:w-48">
                            <Image src="/logo-cu.png" alt="ÇÜ Yemekhane" fill className="object-contain object-left" priority />
                        </div>
                        <div className="flex items-center gap-2">
                            <InfoDialog />
                            <AuthButton />
                            <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

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
                        <p className="text-xs text-muted-foreground">
                            {favorites.length} favori yemek
                        </p>
                    </div>
                </div>

                {/* Favorites List */}
                {favorites.length === 0 ? (
                    <Card className="border border-border/40 bg-card p-8 text-center">
                        <Heart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Henüz favori yemeğiniz yok.
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Menüdeki yemeklerin yanındaki üç nokta menüsünden favorilere ekleyebilirsiniz.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 text-xs"
                            onClick={() => router.push("/")}
                        >
                            Menüye Dön
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {favorites.map((mealName) => (
                            <Card
                                key={mealName}
                                className="border border-border/40 bg-card px-3 py-2.5 flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 flex-shrink-0" />
                                    <span className="text-sm font-medium text-foreground truncate">
                                        {toTitleCase(mealName)}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                                    onClick={() => handleRemoveFavorite(mealName)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
