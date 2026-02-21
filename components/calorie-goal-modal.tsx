"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/components/ui/use-mobile"

interface CalorieGoalModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentGoal?: number | null
    onGoalSet: (goal: number) => void
}

const PRESETS = [300, 500, 700, 900]

function CalorieGoalForm({
    currentGoal,
    onGoalSet,
    onClose,
}: {
    currentGoal?: number | null
    onGoalSet: (goal: number) => void
    onClose: () => void
}) {
    const [value, setValue] = useState<string>(
        currentGoal ? String(currentGoal) : ""
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    const numericValue = parseInt(value, 10)
    const isValid = !isNaN(numericValue) && numericValue > 0

    const handleSubmit = async () => {
        if (!isValid) return
        setIsSubmitting(true)
        onGoalSet(numericValue)
        setIsSubmitting(false)
    }

    const isFirstTime = !currentGoal

    return (
        <div className="space-y-4">
            {/* Onboarding message — only for first-time users */}
            {isFirstTime && (
                <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Kalori takibine başlamadan önce günlük bir hedef belirlemeniz gerekiyor.
                        Hedef belirlemek, günlük alımınızı takip etmenize ve beslenme dengenizi korumanıza yardımcı olur.
                    </p>
                </div>
            )}

            {/* Preset buttons */}
            <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Hızlı seçim</span>
                <div className="grid grid-cols-4 gap-1.5">
                    {PRESETS.map((preset) => (
                        <Button
                            key={preset}
                            variant={value === String(preset) ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs font-mono"
                            onClick={() => setValue(String(preset))}
                        >
                            {preset}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Custom input */}
            <Input
                type="number"
                min={1}
                step={50}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ör: 2000"
                className="font-mono h-9 text-sm"
            />

            {value && !isValid && (
                <p className="text-xs text-destructive">
                    Geçerli bir kalori değeri girin.
                </p>
            )}

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="w-full"
                size="sm"
            >
                {currentGoal ? "Hedefi Güncelle" : "Hedefi Belirle ve Başla"}
            </Button>
        </div>
    )
}

export function CalorieGoalModal({
    open,
    onOpenChange,
    currentGoal,
    onGoalSet,
}: CalorieGoalModalProps) {
    const isMobile = useIsMobile()

    const handleGoalSet = (goal: number) => {
        onGoalSet(goal)
        onOpenChange(false)
    }

    const title = currentGoal ? "Kalori Hedefini Güncelle" : "Kalori Hedefi Belirle"
    const description = currentGoal
        ? `Mevcut hedefiniz: ${currentGoal} kcal`
        : "Kalori takibine başlamak için günlük hedefinizi belirleyin"

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader className="text-center">
                            <DrawerTitle className="text-lg">
                                {title}
                            </DrawerTitle>
                            <DrawerDescription className="text-xs text-muted-foreground">
                                {description}
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-2">
                            <CalorieGoalForm
                                currentGoal={currentGoal}
                                onGoalSet={handleGoalSet}
                                onClose={() => onOpenChange(false)}
                            />
                        </div>
                        <DrawerFooter className="pt-2">
                            <DrawerClose asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground"
                                >
                                    Vazgeç
                                </Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-xs">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <CalorieGoalForm
                    currentGoal={currentGoal}
                    onGoalSet={handleGoalSet}
                    onClose={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
