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
