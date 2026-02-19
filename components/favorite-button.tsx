"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AuthDrawer } from "@/components/auth-drawer"
import { useFavorites } from "@/hooks/use-favorites"

interface FavoriteButtonProps {
    mealName: string
}

export function FavoriteButton({ mealName }: FavoriteButtonProps) {
    const { data: session } = useSession()
    const { isFavorited, toggleFavorite } = useFavorites()
    const [showAuthDrawer, setShowAuthDrawer] = useState(false)
    const favorited = isFavorited(mealName)

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!session?.user) {
            setShowAuthDrawer(true)
            return
        }

        const success = await toggleFavorite(mealName)
        if (success) {
            toast.success(
                favorited
                    ? `${mealName} favorilerden çıkarıldı`
                    : `${mealName} favorilere eklendi`,
                { duration: 2000 }
            )
        } else {
            toast.error("Bir hata oluştu", { duration: 2000 })
        }
    }

    return (
        <>
            <button
                onClick={handleClick}
                className={cn(
                    "p-0.5 rounded transition-colors flex-shrink-0",
                    favorited
                        ? "text-red-500 hover:text-red-600"
                        : "text-muted-foreground/40 hover:text-red-400"
                )}
                aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={favorited ? "filled" : "empty"}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.15, type: "spring", stiffness: 500 }}
                    >
                        <Heart
                            className="h-3.5 w-3.5"
                            fill={favorited ? "currentColor" : "none"}
                            strokeWidth={favorited ? 0 : 2}
                        />
                    </motion.div>
                </AnimatePresence>
            </button>
            <AuthDrawer
                open={showAuthDrawer}
                onOpenChange={setShowAuthDrawer}
                message="Yemekleri favorilere eklemek için giriş yapmanız gerekiyor."
            />
        </>
    )
}
