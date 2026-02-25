"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowUp01, ArrowUp10, ArrowUpAZ, ArrowUpZA } from "lucide-react"
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"

// ─── Türkçe Normalize ────────────────────────────────────────────────────────

const TURKISH_MAP: Record<string, string> = {
    "ç": "c", "Ç": "c",
    "ğ": "g", "Ğ": "g",
    "ı": "i", "I": "i",
    "İ": "i",
    "ö": "o", "Ö": "o",
    "ş": "s", "Ş": "s",
    "ü": "u", "Ü": "u",
}

function normalizeTurkish(str: string): string {
    return str
        .toLowerCase()
        .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (char) => TURKISH_MAP[char] || char)
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MealDate {
    date: string
    dayName: string
}

interface MealSearchResult {
    name: string
    calories: number
    category: string
    dates: MealDate[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MenuSearchCommand() {
    const [open, setOpen] = useState(false)
    const [meals, setMeals] = useState<MealSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState("")
    const [sortMode, setSortMode] = useState<"date-desc" | "date-asc" | "az" | "za">("date-desc")
    const [sorting, setSorting] = useState(false)
    const router = useRouter()

    // Ctrl+K / ⌘K kısayolu
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    // Dialog açıldığında verileri fetch et (bir kez)
    useEffect(() => {
        if (open && meals.length === 0 && !loading) {
            setLoading(true)
            fetch("/api/menu/search")
                .then((res) => res.json())
                .then((data) => {
                    setMeals(data.meals || [])
                })
                .catch(() => {
                    setMeals([])
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [open, meals.length, loading])

    // Dialog kapanınca query temizle
    const handleOpenChange = useCallback((value: boolean) => {
        setOpen(value)
        if (!value) setQuery("")
    }, [])

    // Sonuca tıklanınca navigate et
    const handleSelect = useCallback((date: string) => {
        setOpen(false)
        setQuery("")
        router.push(`/?date=${date}`)
    }, [router])

    // Filtreleme — Türkçe normalize
    const normalizedQuery = normalizeTurkish(query)
    const isTyping = normalizedQuery.length > 0 && normalizedQuery.length < 3
    const filtered = normalizedQuery.length >= 3
        ? meals.filter((meal) =>
            normalizeTurkish(meal.name).includes(normalizedQuery)
        )
        : []

    // Tarih formatlama
    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split("-")
        return `${d}.${m}.${y}`
    }

    // Sıralanmış sonuçlar — YYYY-MM-DD formatında string karşılaştırma (yıl→ay→gün)
    type FlatResult = { meal: MealSearchResult; d: MealDate }
    const sortedResults = useMemo(() => {
        const flat: FlatResult[] = filtered.flatMap((meal) =>
            meal.dates.map((d) => ({ meal, d }))
        )

        switch (sortMode) {
            case "date-desc":
                return flat.sort((a, b) => (a.d.date < b.d.date ? 1 : a.d.date > b.d.date ? -1 : 0))
            case "date-asc":
                return flat.sort((a, b) => (a.d.date > b.d.date ? 1 : a.d.date < b.d.date ? -1 : 0))
            case "az":
                return flat.sort((a, b) => a.meal.name.localeCompare(b.meal.name, "tr"))
            case "za":
                return flat.sort((a, b) => b.meal.name.localeCompare(a.meal.name, "tr"))
            default:
                return flat
        }
    }, [filtered, sortMode])




    const toggleDateSort = useCallback(() => {
        setSortMode((prev) => {
            const next = prev === "date-desc" ? "date-asc" : "date-desc"
            setSorting(true)
            setTimeout(() => {
                setSortMode(next)
                setSorting(false)
            }, 150)
            return prev
        })
    }, [])

    const toggleAlphaSort = useCallback(() => {
        setSortMode((prev) => {
            const next = prev === "az" ? "za" : "az"
            setSorting(true)
            setTimeout(() => {
                setSortMode(next)
                setSorting(false)
            }, 150)
            return prev
        })
    }, [])

    return (
        <>
            {/* Trigger Button — shadcn docs stili geniş input */}
            <button
                onClick={() => setOpen(true)}
                className="group flex items-center gap-2 h-8 rounded-md border border-border/40 bg-background/50 px-3 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer w-full max-w-[200px] md:max-w-[240px]"
            >
                <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="flex-1 text-left text-xs truncate md:hidden">Arayın...</span>
                <span className="flex-1 text-left text-xs truncate hidden md:inline">Menüde arayın...</span>
                <Kbd className="inline-flex h-5 px-1.5 text-[10px] pointer-events-none">
                    <span className="text-[10px]">⌘</span>K
                </Kbd>
            </button>

            {/* Command Dialog */}
            <CommandDialog
                open={open}
                onOpenChange={handleOpenChange}
                title="Menü Araması"
                description="Yemek arayın, sonuca tıklayarak o günün menüsüne gidin."
                showCloseButton={false}
            >
                <CommandInput
                    placeholder="Menüde arayın..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList className="max-h-[400px]">
                    {loading && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Yükleniyor...
                        </div>
                    )}

                    {!loading && isTyping && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Aramak için en az <span className="font-medium text-foreground/70">3 harf</span> yazmalısınız.
                        </div>
                    )}

                    {!loading && normalizedQuery.length >= 3 && filtered.length === 0 && (
                        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                    )}

                    {!loading && query.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Bir yemek ismi yazarak aramaya başlayın.
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <CommandGroup>
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <span className="text-xs font-medium text-muted-foreground">Sonuçlar</span>
                                <div className="flex items-center gap-0.5">
                                    <button
                                        onClick={toggleDateSort}
                                        className={`p-1 rounded-sm transition-colors cursor-pointer ${sortMode === "date-desc" || sortMode === "date-asc"
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                            }`}
                                        title={sortMode === "date-desc" ? "Eskiden yeniye sırala" : "Yeniden eskiye sırala"}
                                    >
                                        {sortMode === "date-asc" ? (
                                            <ArrowUp01 className="h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowUp10 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={toggleAlphaSort}
                                        className={`p-1 rounded-sm transition-colors cursor-pointer ${sortMode === "az" || sortMode === "za"
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                            }`}
                                        title={sortMode === "az" ? "Z-A sırala" : "A-Z sırala"}
                                    >
                                        {sortMode === "za" ? (
                                            <ArrowUpZA className="h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowUpAZ className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {sorting ? (
                                <div className="space-y-2 px-2 py-1">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex flex-col gap-1 animate-pulse">
                                            <div className="h-4 bg-muted rounded w-3/4" />
                                            <div className="h-3 bg-muted rounded w-1/3" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                sortedResults.map(({ meal, d }) => (
                                    <CommandItem
                                        key={`${meal.name}-${d.date}`}
                                        value={`${meal.name} ${d.date}`}
                                        onSelect={() => handleSelect(d.date)}
                                        className="flex flex-col items-start gap-0.5 py-2.5"
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="font-medium text-sm">{meal.name}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {meal.calories} kcal
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {d.dayName}, {formatDate(d.date)}
                                        </span>
                                    </CommandItem>
                                ))
                            )}
                        </CommandGroup>
                    )}
                </CommandList>

                {/* Footer — Navigate / Select / Esc */}
                <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Kbd>↑</Kbd>
                            <Kbd>↓</Kbd>
                            <span className="ml-0.5">Navigate</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Kbd>↵</Kbd>
                            <span className="ml-0.5">Select</span>
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Kbd>Esc</Kbd>
                        <span className="ml-0.5">Kapat</span>
                    </span>
                </div>
            </CommandDialog>
        </>
    )
}
