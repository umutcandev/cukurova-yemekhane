"use client"

import * as React from "react"
import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TablePaginationProps {
    /** 1 tabanlı geçerli sayfa */
    page: number
    /** Sayfa başına öğe sayısı */
    pageSize: number
    /** Toplam öğe sayısı */
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    /** "Rows per page" seçenekleri. Boş/undefined ise seçici gizlenir. */
    pageSizeOptions?: number[]
    className?: string
}

export function TablePagination({
    page,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 30, 40],
    className,
}: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const clampedPage = Math.min(Math.max(page, 1), totalPages)

    const from = totalItems === 0 ? 0 : (clampedPage - 1) * pageSize + 1
    const to = Math.min(clampedPage * pageSize, totalItems)

    // Sayfa input'unun yerel taslak değeri (yazarken serbest, blur/Enter'da uygulanır)
    const [pageDraft, setPageDraft] = React.useState(String(clampedPage))

    React.useEffect(() => {
        setPageDraft(String(clampedPage))
    }, [clampedPage])

    const goToPage = React.useCallback(
        (next: number) => {
            const target = Math.min(Math.max(next, 1), totalPages)
            if (target !== clampedPage) {
                onPageChange(target)
            }
        },
        [clampedPage, totalPages, onPageChange]
    )

    const commitDraft = React.useCallback(() => {
        const parsed = parseInt(pageDraft, 10)
        if (Number.isNaN(parsed)) {
            setPageDraft(String(clampedPage))
            return
        }
        const target = Math.min(Math.max(parsed, 1), totalPages)
        setPageDraft(String(target))
        goToPage(target)
    }, [pageDraft, clampedPage, totalPages, goToPage])

    const isFirst = clampedPage <= 1
    const isLast = clampedPage >= totalPages

    return (
        <div
            className={cn(
                "flex flex-row items-center justify-between gap-2",
                className
            )}
        >
            {/* Sol: özet metni */}
            <p className="text-xs text-muted-foreground tabular-nums shrink-0">
                {from}–{to} / {totalItems}
            </p>

            {/* Orta: gezinme kontrolleri */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={isFirst}
                            onClick={() => goToPage(clampedPage - 1)}
                            aria-label="Önceki sayfa"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Önceki</TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-1.5 px-1">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={pageDraft}
                        onChange={(e) => setPageDraft(e.target.value.replace(/[^0-9]/g, ""))}
                        onBlur={commitDraft}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.currentTarget.blur()
                            } else if (e.key === "ArrowUp") {
                                e.preventDefault()
                                goToPage(clampedPage + 1)
                            } else if (e.key === "ArrowDown") {
                                e.preventDefault()
                                goToPage(clampedPage - 1)
                            }
                        }}
                        aria-label="Sayfa numarası"
                        className="h-7 w-9 rounded-md border border-input bg-transparent text-center text-xs text-foreground tabular-nums shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        / {totalPages}
                    </span>
                </div>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={isLast}
                            onClick={() => goToPage(clampedPage + 1)}
                            aria-label="Sonraki sayfa"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sonraki</TooltipContent>
                </Tooltip>
            </div>

            {/* Sağ: sayfa boyutu seçici ("Görüntüle" etiketi mobilde gizli) */}
            {onPageSizeChange && pageSizeOptions.length > 0 ? (
                <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden text-xs text-muted-foreground whitespace-nowrap sm:inline">
                        Görüntüle
                    </span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                        <SelectTrigger size="sm" className="h-7 w-fit gap-1 px-2 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((option) => (
                                <SelectItem
                                    key={option}
                                    value={String(option)}
                                    className="text-xs"
                                >
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                // Seçici yoksa özet metnini dengelemek için boş alan
                <span className="shrink-0" aria-hidden />
            )}
        </div>
    )
}
