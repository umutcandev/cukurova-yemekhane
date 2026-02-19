"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AuthDrawer } from "@/components/auth-drawer"
import { useDailyLog } from "@/hooks/use-daily-log"

interface AddMealButtonProps {
    mealName: string
    calories: number
    menuDate: string
}

export function AddMealButton({ mealName, calories, menuDate }: AddMealButtonProps) {
    const { data: session } = useSession()
    const { isConsumed, addMeal, removeMeal } = useDailyLog(menuDate)
    const [showAuthDrawer, setShowAuthDrawer] = useState(false)
    const consumed = isConsumed(mealName)

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!session?.user) {
            setShowAuthDrawer(true)
            return
        }

        if (consumed) {
            const success = await removeMeal(mealName)
            if (success) {
                toast.success(`${mealName} günlükten çıkarıldı`, { duration: 2000 })
            } else {
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        } else {
            const success = await addMeal(mealName, calories)
            if (success) {
                toast.success(`${mealName} (${calories} kcal) günlüğünüze eklendi`, {
                    duration: 2000,
                })
            } else {
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        }
    }

    return (
        <>
            <button
                onClick={handleClick}
                className={cn(
                    "inline-flex items-center justify-center h-5 w-5 rounded-md transition-colors flex-shrink-0",
                    consumed
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-muted/60 text-muted-foreground/60 hover:bg-primary/10 hover:text-primary"
                )}
                aria-label={consumed ? "Günlükten çıkar" : "Bunu yedim"}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={consumed ? "check" : "plus"}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.15, type: "spring", stiffness: 500 }}
                    >
                        {consumed ? (
                            <Check className="h-3 w-3" strokeWidth={3} />
                        ) : (
                            <Plus className="h-3 w-3" strokeWidth={2.5} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </button>
            <AuthDrawer
                open={showAuthDrawer}
                onOpenChange={setShowAuthDrawer}
                message="Kalori takibi için giriş yapmanız gerekiyor."
            />
        </>
    )
}
