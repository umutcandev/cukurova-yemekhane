"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
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
    const isMobile = useIsMobile()

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
            timeZone: "Europe/Istanbul",
        })
    }

    const formatLastUpdated = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            timeZone: "Europe/Istanbul",
        })
    }

    return (
        <nav className="dark text-foreground fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/40">
            {/* Info Bar */}
            <div className="bg-muted/20 border-b border-border/40">
                <div className="container mx-auto flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground">
                    <span>Son Güncelleme: <span className="font-mono text-foreground/80" suppressHydrationWarning>{formatLastUpdated(lastUpdated)}</span></span>
                    <span>Menüdeki Gün Sayısı: <span className="font-mono text-foreground/80">{totalDays}</span></span>
                </div>
            </div>

            <div className="container mx-auto flex items-center justify-between px-4 py-3">
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
                {isMobile ? (
                    <Drawer open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <DrawerTrigger asChild>
                            <Button suppressHydrationWarning variant="outline" size="sm" className="rounded-lg gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span className="text-xs">Tarih Seç</span>
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <div className="mx-auto w-full max-w-sm">
                                <DrawerHeader className="text-center">
                                    <DrawerTitle className="text-lg">Tarih Seçin</DrawerTitle>
                                    <DrawerDescription className="text-sm text-muted-foreground/80">
                                        Menüsünü görüntülemek istediğiniz günü veya tarih aralığını seçin.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <div className="px-4 pb-6">
                                    <DatePicker
                                        availableDates={availableDates}
                                        onDateRangeSelect={handleDateRangeSelect}
                                        onCancel={handleCancel}
                                    />
                                </div>
                            </div>
                        </DrawerContent>
                    </Drawer>
                ) : (
                    <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <DialogTrigger asChild>
                            <Button suppressHydrationWarning variant="outline" size="sm" className="rounded-lg gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span className="text-xs">Tarih Seç</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Tarih Seçin</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground/80">
                                    Menüsünü görüntülemek istediğiniz günü veya tarih aralığını seçin.
                                </DialogDescription>
                            </DialogHeader>
                            <DatePicker
                                availableDates={availableDates}
                                onDateRangeSelect={handleDateRangeSelect}
                                onCancel={handleCancel}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </nav>
    )
}
