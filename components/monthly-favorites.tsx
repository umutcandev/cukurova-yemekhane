"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { ThumbsUp, ThumbsDown, AlertCircle, TrendingUp, TrendingDown, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
    const [isExpanded, setIsExpanded] = useState(false)
    const [topLiked, setTopLiked] = useState<MonthlyReaction[]>([])
    const [topDisliked, setTopDisliked] = useState<MonthlyReaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedMenu, setSelectedMenu] = useState<DayMenu | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [menuNotFound, setMenuNotFound] = useState(false)

    // Get Turkish month name from browser
    const monthName = new Date().toLocaleDateString("tr-TR", { month: "long" })
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    // Get current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7)

    // Fetch monthly data only when expanded
    const fetchMonthlyData = useCallback(async () => {
        if (hasFetched) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/reactions/monthly?month=${currentMonth}`)

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
    }, [currentMonth, hasFetched])

    // Handle expand toggle
    const handleExpandToggle = () => {
        const newExpanded = !isExpanded
        setIsExpanded(newExpanded)

        if (newExpanded && !hasFetched) {
            fetchMonthlyData()
        }
    }

    // Handle menu click
    const handleMenuClick = useCallback((date: string) => {
        const menu = menuData.days.find(day => day.date === date)

        if (menu) {
            setSelectedMenu(menu)
            setMenuNotFound(false)
        } else {
            setSelectedMenu(null)
            setMenuNotFound(true)
        }
        setDrawerOpen(true)
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
            <Card className="border border-border/40 bg-card overflow-hidden shadow-sm mt-4 mb-20 gap-0">
                {/* Header - Clickable to expand */}
                <button
                    onClick={handleExpandToggle}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                    <div className="text-left">
                        <h2 className="text-lg font-semibold text-foreground tracking-tight">
                            {capitalizedMonthName} Ayının Enleri
                        </h2>
                        <p className="text-xs text-muted-foreground/70 leading-tight mt-1">
                            En beğenilen ve en beğenilmeyen menüleri senin için hazırladık. Hemen buraya tıklayarak göz gezdirebilirsin!
                        </p>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 shrink-0"
                    >
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                </button>

                {/* Expandable Content */}
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="border-t border-border/40">
                                {error ? (
                                    <div className="flex flex-col items-center justify-center py-6 space-y-2">
                                        <AlertCircle className="h-6 w-6 text-destructive" />
                                        <p className="text-sm text-muted-foreground">{error}</p>
                                    </div>
                                ) : (
                                    <Tabs defaultValue="liked" className="w-full gap-0">
                                        <TabsList className="w-full h-9 bg-muted/50 p-1 rounded-none">
                                            <TabsTrigger
                                                value="liked"
                                                className="flex-1 gap-1.5 h-7 text-xs rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                                            >
                                                <TrendingUp className="h-3.5 w-3.5" />
                                                En Beğenilenler
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="disliked"
                                                className="flex-1 gap-1.5 h-7 text-xs rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                                            >
                                                <TrendingDown className="h-3.5 w-3.5" />
                                                En Beğenilmeyenler
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="liked" className="mt-0 pb-2">
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

                                        <TabsContent value="disliked" className="mt-0 pb-2">
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Menu Detail Drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent className="max-h-[85vh] px-4 pb-6">
                    <DrawerHeader className="px-0 pt-2 pb-4">
                        <DrawerTitle className="text-lg font-semibold">
                            {selectedMenu ? formatMenuDate(selectedMenu.date) : "Menü Detayı"}
                        </DrawerTitle>
                    </DrawerHeader>

                    {menuNotFound ? (
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
