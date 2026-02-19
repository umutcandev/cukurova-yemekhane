"use client"

import { useState, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { ThumbsUp, ThumbsDown, AlertCircle, ArrowRight } from "lucide-react"
import type { MenuData, DayMenu } from "@/lib/types"

// Rank Badge Component - filled square with number inside
function RankBadge({ rank }: { rank: number }) {
    if (rank > 3) {
        return (
            <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-muted-foreground">
                {rank}.
            </span>
        )
    }

    const colors = {
        1: "bg-amber-400 text-amber-950",
        2: "bg-slate-300 text-slate-800",
        3: "bg-amber-600 text-amber-50",
    }

    return (
        <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${colors[rank as 1 | 2 | 3]}`}>
            {rank}
        </span>
    )
}

// Format date for display
function formatMenuDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Istanbul",
    }) + " Menüsü"
}

interface MonthlyReaction {
    date: string
    likeCount: number
    dislikeCount: number
}

interface MonthlyFavoritesProps {
    menuData: MenuData
}

export function MonthlyFavorites({ menuData }: MonthlyFavoritesProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [topLiked, setTopLiked] = useState<MonthlyReaction[]>([])
    const [topDisliked, setTopDisliked] = useState<MonthlyReaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedMenu, setSelectedMenu] = useState<DayMenu | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [menuNotFound, setMenuNotFound] = useState(false)
    const [isPending, setIsPending] = useState(false)

    // Compute target month (previous month in YYYY-MM format) for API call
    // No month name needed in UI, so no hydration mismatch risk
    const targetMonth = useMemo(() => {
        const now = new Date()
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`
    }, [])

    // Fetch monthly data only when dialog opens
    const fetchMonthlyData = useCallback(async () => {
        if (hasFetched) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/reactions/monthly?month=${targetMonth}`)

            if (!response.ok) {
                throw new Error("Veri yüklenemedi")
            }

            const data = await response.json()
            // Only take first 5
            setTopLiked((data.topLiked || []).slice(0, 5))
            setTopDisliked((data.topDisliked || []).slice(0, 5))
            setHasFetched(true)
        } catch (err) {
            console.error("Error fetching monthly data:", err)
            setError(err instanceof Error ? err.message : "Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }, [targetMonth, hasFetched])

    // Handle dialog open
    const handleDialogOpen = () => {
        setDialogOpen(true)
        if (!hasFetched) {
            fetchMonthlyData()
        }
    }

    // Handle menu click — önce mevcut menuData'da arar, bulamazsa API'den çeker
    const handleMenuClick = useCallback(async (date: string) => {
        const local = menuData.days.find(day => day.date === date)

        if (local) {
            setSelectedMenu(local)
            setMenuNotFound(false)
            setDrawerOpen(true)
            return
        }

        // Geçmiş aylarda arama yap
        setSelectedMenu(null)
        setMenuNotFound(false)
        setIsPending(true)
        setDrawerOpen(true)

        try {
            const res = await fetch(`/api/menu/date/${date}`)
            const data = await res.json()

            if (data.found && data.day) {
                setSelectedMenu(data.day)
                setMenuNotFound(false)
            } else {
                setMenuNotFound(true)
            }
        } catch {
            setMenuNotFound(true)
        } finally {
            setIsPending(false)
        }
    }, [menuData.days])

    // Render menu row
    const renderMenuRow = (item: MonthlyReaction, index: number, type: "liked" | "disliked") => {
        const count = type === "liked" ? item.likeCount : item.dislikeCount

        return (
            <TableRow
                key={item.date}
                className="border-border/40 hover:bg-muted/30 cursor-pointer last:border-b-0"
                onClick={() => handleMenuClick(item.date)}
            >
                <TableCell className="py-2.5 w-4">
                    <RankBadge rank={index + 1} />
                </TableCell>
                <TableCell className="py-2.5 font-medium text-sm text-foreground">
                    {formatMenuDate(item.date)}
                </TableCell>
                <TableCell className="py-2.5 text-right w-[1%]">
                    <Badge
                        variant="secondary"
                        className={`font-mono font-normal text-[11px] h-5 px-1.5 gap-1 ${type === "liked"
                            ? "text-green-600 dark:text-green-400 bg-green-500/10"
                            : "text-red-600 dark:text-red-400 bg-red-500/10"
                            }`}
                    >
                        {count}
                        {type === "liked" ? (
                            <ThumbsUp className="h-3 w-3" />
                        ) : (
                            <ThumbsDown className="h-3 w-3" />
                        )}
                    </Badge>
                </TableCell>
            </TableRow>
        )
    }

    // Loading skeleton
    const renderSkeleton = () => (
        <Table>
            <TableBody>
                {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border/40 last:border-b-0">
                        <TableCell className="py-2.5 w-8">
                            <Skeleton className="h-5 w-5 rounded" />
                        </TableCell>
                        <TableCell className="py-2.5">
                            <Skeleton className="h-4 w-full max-w-[200px]" />
                        </TableCell>
                        <TableCell className="py-2.5 text-right w-[1%]">
                            <Skeleton className="h-5 w-12 ml-auto" />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )

    // Empty state
    const renderEmpty = (type: "liked" | "disliked") => (
        <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-muted-foreground text-sm">
                {type === "liked"
                    ? "Henüz beğenilen menü bulunmuyor"
                    : "Henüz beğenilmeyen menü bulunmuyor"}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">
                Menüleri beğenerek katkıda bulunabilirsiniz
            </p>
        </div>
    )

    return (
        <>
            {/* Simple text trigger */}
            <button
                onClick={handleDialogOpen}
                className="w-full justify-center group inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors mb-6"
            >
                <span>🎉</span>
                <span className="underline decoration-foreground/20 underline-offset-4 decoration-1">
                    Geçtiğimiz ayın en beğenilen menüleri
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* Dialog with Tabs and Table */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-[360px] sm:max-w-md max-h-[85vh] overflow-hidden p-0">
                    <DialogHeader className="px-4 pt-4 pb-0">
                        <DialogTitle className="text-lg font-semibold">
                            Geçtiğimiz Ayın Enleri
                        </DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto">
                        {error ? (
                            <div className="flex flex-col items-center justify-center py-6 space-y-2">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="liked" className="w-full">
                                <TabsList className="w-full h-9 bg-muted/50 p-1 rounded-none">
                                    <TabsTrigger
                                        value="liked"
                                        className="flex-1 gap-1.5 h-7 text-xs rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                                    >
                                        En Beğenilenler
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="disliked"
                                        className="flex-1 gap-1.5 h-7 text-xs rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                                    >
                                        En Beğenilmeyenler
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="liked" className="mt-0 pb-4">
                                    {isLoading ? (
                                        renderSkeleton()
                                    ) : topLiked.length === 0 ? (
                                        renderEmpty("liked")
                                    ) : (
                                        <Table>
                                            <TableBody>
                                                {topLiked.map((item, index) => renderMenuRow(item, index, "liked"))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </TabsContent>

                                <TabsContent value="disliked" className="mt-0 pb-4">
                                    {isLoading ? (
                                        renderSkeleton()
                                    ) : topDisliked.length === 0 ? (
                                        renderEmpty("disliked")
                                    ) : (
                                        <Table>
                                            <TableBody>
                                                {topDisliked.map((item, index) => renderMenuRow(item, index, "disliked"))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Menu Detail Drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent className="max-h-[85vh] px-4 pb-6">
                    <DrawerHeader className="px-0 pt-2 pb-4">
                        <DrawerTitle className="text-lg font-semibold">
                            {selectedMenu ? formatMenuDate(selectedMenu.date) : "Menü Detayı"}
                        </DrawerTitle>
                    </DrawerHeader>

                    {isPending ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-5 w-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        </div>
                    ) : menuNotFound ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <AlertCircle className="h-12 w-12 text-amber-500" />
                            <div className="text-center">
                                <p className="text-sm font-medium">Menü bulunamadı</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Bu tarih için menü verisi artık mevcut değil
                                </p>
                            </div>
                        </div>
                    ) : selectedMenu ? (
                        <div className="space-y-4 overflow-y-auto">
                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">
                                                Yemek
                                            </th>
                                            <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2.5">
                                                Kalori
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedMenu.meals.map((meal, idx) => (
                                            <tr
                                                key={idx}
                                                className="border-t border-border hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-3 py-3 text-sm font-medium">{meal.name}</td>
                                                <td className="px-3 py-3 text-sm text-muted-foreground text-right font-mono">
                                                    {meal.calories} kcal
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <span className="text-sm text-muted-foreground">Toplam Kalori</span>
                                <Badge
                                    variant="secondary"
                                    className={`font-mono ${selectedMenu.totalCalories < 800
                                        ? "text-green-600 dark:text-green-400 bg-green-500/10"
                                        : selectedMenu.totalCalories < 1100
                                            ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                            : "text-red-600 dark:text-red-400 bg-red-500/10"
                                        }`}
                                >
                                    {selectedMenu.totalCalories} kcal
                                </Badge>
                            </div>
                        </div>
                    ) : null}
                </DrawerContent>
            </Drawer>
        </>
    )
}
