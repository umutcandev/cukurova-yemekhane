"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { useMediaQuery } from "../hooks/use-media-query"
import Image from "next/image"
import { useEffect, useState } from "react"
import type { MealDetail } from "@/lib/types"
import { toTitleCase } from "@/lib/utils"

interface MealDetailProps {
    mealId: string
    mealName: string
    mealCalories: number
    open: boolean
    onOpenChange: (open: boolean) => void
}



function getCalorieBadgeClasses(calories: number): string {
    const baseClasses = "font-mono border"
    if (calories < 800) {
        // Yeşil - düşük kalori
        return `${baseClasses} border-green-500 text-green-700 dark:text-green-400 bg-green-500/10`
    }
    if (calories < 1100) {
        // Turuncu - orta kalori
        return `${baseClasses} border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-500/10`
    }
    // Kırmızı - yüksek kalori
    return `${baseClasses} border-red-500 text-red-700 dark:text-red-400 bg-red-500/10`
}

function MealDetailContent({ mealId, mealName, mealCalories }: Omit<MealDetailProps, "open" | "onOpenChange">) {
    const [mealDetail, setMealDetail] = useState<MealDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchMealDetail() {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(`/api/meal/${mealId}`)

                if (!response.ok) {
                    throw new Error('Yemek detayı yüklenemedi')
                }

                const data: MealDetail = await response.json()
                setMealDetail(data)
            } catch (err) {
                console.error('Error fetching meal detail:', err)
                setError(err instanceof Error ? err.message : 'Bir hata oluştu')
            } finally {
                setIsLoading(false)
            }
        }

        fetchMealDetail()
    }, [mealId])

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div className="text-center">
                    <p className="text-sm font-medium">{error}</p>
                    <p className="text-xs text-muted-foreground mt-1">Lütfen daha sonra tekrar deneyin</p>
                </div>
            </div>
        )
    }

    // Use the fetched data or fallback to props
    const displayCalories = mealDetail?.calories ?? mealCalories
    const displayName = toTitleCase(mealName)

    return (
        <div className="space-y-5 md:space-y-6">
            {/* Image Section */}
            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                {isLoading ? (
                    <Skeleton className="w-full h-full" />
                ) : mealDetail?.imageUrl ? (
                    <Image
                        src={mealDetail.imageUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center p-6">
                            <div className="text-4xl mb-2">🍽️</div>
                            <p className="text-sm text-muted-foreground">Fotoğraf bulunamadı</p>
                        </div>
                    </div>
                )}
                {!isLoading && (
                    <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(mealName)}&tbm=isch`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-xs rounded-sm px-3 py-1.5 flex items-center gap-1.5 transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google Görseller ile Ara
                    </a>
                )}
            </div>

            {/* Calorie Badge */}
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base md:text-lg font-semibold flex-1">{displayName}</h3>
                <Badge className={`${getCalorieBadgeClasses(displayCalories)} text-xs md:text-sm shrink-0`}>
                    {displayCalories} kcal
                </Badge>
            </div>

            {/* Ingredients Table */}
            <div>
                <h4 className="text-sm font-semibold mb-3 md:mb-3 text-muted-foreground">İçindekiler</h4>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : mealDetail && mealDetail.ingredients.length > 0 ? (
                    <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-3 md:px-4 py-2.5 md:py-2">
                                        Malzeme
                                    </th>
                                    <th className="text-right text-xs font-medium text-muted-foreground px-3 md:px-4 py-2.5 md:py-2">
                                        Miktar
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {mealDetail.ingredients.map((ingredient, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-t border-border hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-3 md:px-4 py-3 md:py-2.5 text-sm font-medium">{ingredient.name}</td>
                                        <td className="px-3 md:px-4 py-3 md:py-2.5 text-sm text-muted-foreground text-right font-mono">
                                            {ingredient.amount} {ingredient.unit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        Malzeme bilgisi bulunamadı
                    </div>
                )}
            </div>
        </div>
    )
}

export function MealDetailModal({ mealId, mealName, mealCalories, open, onOpenChange }: MealDetailProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{toTitleCase(mealName)}</DialogTitle>
                    </DialogHeader>
                    <MealDetailContent mealId={mealId} mealName={mealName} mealCalories={mealCalories} />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh] px-4 pb-6">
                <DrawerHeader className="px-0 pt-2 pb-4">
                    <DrawerTitle className="text-lg font-semibold">{toTitleCase(mealName)}</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-1 -mx-1">
                    <MealDetailContent mealId={mealId} mealName={mealName} mealCalories={mealCalories} />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
