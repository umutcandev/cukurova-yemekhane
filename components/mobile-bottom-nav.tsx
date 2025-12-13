"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet"
import type { DateRange } from "react-day-picker"

interface MobileBottomNavProps {
    availableDates: Date[]
    currentDate: Date
    onDateRangeSelect: (range: DateRange | undefined) => void
    onPrevious: () => void
    onNext: () => void
    canGoPrevious: boolean
    canGoNext: boolean
    lastUpdated: string
    totalDays: number
}

export function MobileBottomNav({
    availableDates,
    currentDate,
    onDateRangeSelect,
    onPrevious,
    onNext,
    canGoPrevious,
    canGoNext,
    lastUpdated,
    totalDays,
}: MobileBottomNavProps) {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        onDateRangeSelect(range)
        setIsDatePickerOpen(false)
    }

    const handleCancel = () => {
        setIsDatePickerOpen(false)
    }

    const formatCurrentDate = (date: Date): string => {
        return date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
        })
    }

    const formatLastUpdated = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("tr-TR")
    }

    return (
        <nav className="dark text-foreground fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
            {/* Info Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-muted/20 border-b border-border/50 text-xs text-muted-foreground">
                <span>Son Güncelleme: <span className="font-mono text-foreground/80">{formatLastUpdated(lastUpdated)}</span></span>
                <span>Menünün Gün Sayısı: <span className="font-mono text-foreground/80">{totalDays}</span></span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
                {/* Left: Arrow Navigation with Date */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={onPrevious}
                        disabled={!canGoPrevious}
                        className="rounded-lg"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm font-medium text-foreground min-w-[70px] text-center">
                        {formatCurrentDate(currentDate)}
                    </span>

                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={onNext}
                        disabled={!canGoNext}
                        className="rounded-lg"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Right: Date Picker Trigger */}
                <Sheet open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-lg gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="text-xs">Tarih Seç</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-auto pb-safe">
                        <SheetHeader className="px-1 pb-4">
                            <SheetTitle className="text-center text-lg">Tarih Seçin</SheetTitle>
                            <SheetDescription className="text-center text-sm text-muted-foreground/80">
                                Menüsünü görüntülemek istediğiniz günü veya tarih aralığını seçin.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-2 pb-6">
                            <DatePicker
                                availableDates={availableDates}
                                onDateRangeSelect={handleDateRangeSelect}
                                onCancel={handleCancel}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    )
}
