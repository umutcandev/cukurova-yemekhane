"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowUp01, ArrowUp10, ArrowUpAZ, ArrowUpZA, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react"
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
    const [loaded, setLoaded] = useState(false)
    const [query, setQuery] = useState("")
    const [sortMode, setSortMode] = useState<"date-desc" | "date-asc" | "az" | "za">("date-desc")

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
        if (open && !loaded && !loading) {
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
                    setLoaded(true)
                })
        }
    }, [open, loaded, loading])

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
        setSortMode((prev) => prev === "date-desc" ? "date-asc" : "date-desc")
    }, [])

    const toggleAlphaSort = useCallback(() => {
        setSortMode((prev) => prev === "az" ? "za" : "az")
    }, [])

    return (
        <>
            {/* Trigger Button — shadcn docs stili geniş input */}
            <button
                onClick={() => setOpen(true)}
                className="group flex items-center gap-1.5 h-8 rounded-md border border-input bg-background shadow-xs px-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-all cursor-pointer w-full max-w-[200px] md:max-w-[240px] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
                <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="flex-1 text-left text-xs truncate md:hidden">Arayın</span>
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
                    placeholder="Menüdeki yemekleri arayın..."
                    value={query}
                    onValueChange={setQuery}
                />
                {!loading && query.length === 0 && (
                    <div className="flex items-center justify-center h-[50vh] sm:h-[400px]">
                        <svg height="64" width="64" viewBox="0 0 16 16" className="text-muted-foreground/15">
                            <path fillRule="evenodd" clipRule="evenodd" d="M3.5 7C3.5 5.067 5.067 3.5 7 3.5C8.933 3.5 10.5 5.067 10.5 7C10.5 7.88461 10.1718 8.69256 9.63058 9.30876L9.30876 9.63058C8.69256 10.1718 7.88461 10.5 7 10.5C5.067 10.5 3.5 8.933 3.5 7ZM9.96544 11.0261C9.13578 11.6382 8.11014 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C9.76142 2 12 4.23858 12 7C12 8.11014 11.6382 9.13578 11.0261 9.96544L14.0303 12.9697L14.5607 13.5L13.5 14.5607L12.9697 14.0303L9.96544 11.0261Z" fill="currentColor" />
                        </svg>
                    </div>
                )}

                <CommandList className={`h-[50vh] max-h-[50vh] sm:h-[400px] sm:max-h-[400px] ${!loading && query.length === 0 ? "hidden" : ""}`}>
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
                            {sortedResults.map(({ meal, d }) => (
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
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>

                {/* Footer — Navigate / Select / Esc */}
                <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Kbd><ArrowUp className="size-3" /></Kbd>
                            <Kbd><ArrowDown className="size-3" /></Kbd>
                            <span className="ml-0.5">Gez</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Kbd><CornerDownLeft className="size-3" /></Kbd>
                            <span className="ml-0.5">Seç</span>
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
