"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Bookmark, CirclePlus, CircleCheck, MessageSquare, Brain, MoreHorizontal } from "lucide-react"
import { motion } from "framer-motion"
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table"
import { LikeDislikeButtons } from "@/components/like-dislike-buttons"
import { MenuShareButton } from "@/components/menu-share-bar"
import { AuthModal } from "@/components/auth-modal"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMenuData } from "@/components/menu-data-provider"
import { CalorieGoalModal } from "@/components/calorie-goal-modal"
import { toast } from "sonner"
import { cn, toTitleCase } from "@/lib/utils"
import { CommentsPanel } from "@/components/comments-panel"
import { MealAllergenMark } from "@/components/allergen-info"
import {
    CalorieNudgeBadge,
    CALORIE_COLUMN_WIDTH,
    CALORIE_COLUMN_WIDTH_NUDGE,
    NUDGE_HOLD_MS,
    NUDGE_MORPH_DELAY_MS,
} from "@/components/allergen-nudge"
import { AiPromptMenu } from "@/components/ai-prompt-menu"
import { useAllergenPreferences } from "@/hooks/use-allergen-preferences"
import { useAllergenNudge } from "@/hooks/use-allergen-nudge"
import type { AllergenHit, DietFlags } from "@/lib/allergens"

function KcalIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 227 230" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <g clipPath="url(#clip0_77_65)">
                <path d="M122.597 14.501C145.256 34.2684 185.189 77.9937 185.189 139.742C185.189 168.952 173.351 194.149 155.736 209.625C151.01 189.225 134.721 172.987 113.595 172.987C92.4689 172.987 76.1785 189.225 71.4521 209.625C53.8381 194.149 42 168.952 42 139.742C42 116.884 51.5247 98.2872 57.8594 88.4932C57.9048 88.5158 57.9578 88.5475 58.0166 88.5928L58.8711 89.25V89.251C78.1026 104.046 103.749 97.4523 115.833 76.541V76.54C120.279 68.8451 122.595 59.9165 122.595 50.8691V14.5713C122.595 14.5467 122.596 14.5232 122.597 14.501Z" stroke="currentColor" strokeWidth="20" />
            </g>
            <defs>
                <clipPath id="clip0_77_65">
                    <rect width="227" height="230" fill="white" />
                </clipPath>
            </defs>
        </svg>
    )
}

// Helper Functions
function formatDayName(dateString: string) {
    const date = new Date(dateString)
    const dayName = date.toLocaleDateString("tr-TR", { weekday: "long", timeZone: "Europe/Istanbul" })
    return dayName.charAt(0).toUpperCase() + dayName.slice(1) + " Menüsü"
}

function formatDateShort(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Istanbul",
    })
}

function generateAiPrompt(menuDay: MenuDay) {
    const jsonStr = JSON.stringify(menuDay, null, 2);
    return `Çukurova Üniversitesi yemekhanesi menüsünü en iyi bilen yapay zeka sensin. Aşağıdaki menüyü incele ve şu üç farklı karakter gibi yorumla:

1. **Şüpheci Diyetisyen:** Menüdeki "gizli tehlikeleri" veya "sağlıklı yanları" esprili bir dille anlat.
2. **Gym Rat (Sporcu):** "Bu menü basmak için yeterli mi?" sorusuna odaklan. Protein durumunu sorgula.
3. **Vize Haftasındaki Öğrenci:** Sadece şuna odaklan: Bu yemek beni mutlu eder mi, doyurur mu ve uyku bastırır mı?

İşte Menü Verisi:
${jsonStr}`;
}

// Types
interface Meal {
    id: string
    name: string
    calories: number
    /** Build-time üretilen alerjen etiketleri; eski JSON'larda yok */
    allergens?: AllergenHit[]
    unmappedIngredients?: string[]
    dietFlags?: DietFlags
}

interface MenuDay {
    ymk: number
    date: string
    hasData: boolean
    meals: Meal[]
    totalCalories: number
}

interface MenuCardProps {
    day: MenuDay
    onMealClick: (mealId: string, mealName: string, mealCalories: number) => void
    autoOpenComments?: boolean
    onCommentsOpened?: () => void
    /**
     * Alerjen dürtmesini bu kart taşıyabilir mi?
     *
     * Tarih aralığı seçildiğinde ekranda birden çok kart oluyor; hepsinde aynı
     * anda "Alerjin mi var?" yanıp sönseydi dürtme değil gürültü olurdu.
     * Sayfa yalnızca ilk karta izin verir.
     */
    allowAllergenNudge?: boolean
}

export function MenuCard({ day, onMealClick, autoOpenComments, onCommentsOpened, allowAllergenNudge = false }: MenuCardProps) {
    const {
        session,
        isFavorited,
        toggleFavorite,
        getDailyLog,
        isConsumed: isConsumedCtx,
        addMeal: addMealCtx,
        removeMeal: removeMealCtx,
        calorieGoal,
        needsGoal,
        setCalorieGoal,
    } = useMenuData()

    // Alerjen işareti yalnızca alerjen seçmiş kullanıcıya çıkar.
    const { preferences: allergenPrefs } = useAllergenPreferences()

    // Tercih yapmamış kullanıcıda ilk yemeğin kalori rozeti bir süre sonra
    // CTA'ya döner, bir süre öyle kalır ve kalıcı olarak kaloriye geri döner.
    //
    // Zamanlayıcı rozette değil burada: sütun genişliği ile rozetin durumu
    // AYNI render'da değişmeli, yoksa rozet bir kare boyunca dar sütuna
    // sığmayan bir metin taşır.
    const { isEligible: allergenNudgeEligible } = useAllergenNudge()
    const nudgeArmed = allowAllergenNudge && allergenNudgeEligible && day.meals.length > 0
    const [nudgeActive, setNudgeActive] = useState(false)
    // Dizi bir kez oynar. Bayrak state değil ref: yeniden oynatmayı engellemesi
    // gerekiyor, render'ı tetiklemesi değil.
    const nudgePlayed = useRef(false)

    useEffect(() => {
        // Kullanıcı bu arada tercihini yaptıysa / dürtmeyi reddettiyse CTA
        // ekranda kalmasın; rozet anında kaloriye döner.
        if (!nudgeArmed) {
            setNudgeActive(false)
            return
        }
        if (nudgePlayed.current) return

        let holdTimer: ReturnType<typeof setTimeout>
        const morphTimer = setTimeout(() => {
            setNudgeActive(true)
            holdTimer = setTimeout(() => {
                nudgePlayed.current = true
                setNudgeActive(false)
            }, NUDGE_HOLD_MS)
        }, NUDGE_MORPH_DELAY_MS)

        return () => {
            clearTimeout(morphTimer)
            clearTimeout(holdTimer)
        }
    }, [nudgeArmed])

    // Fetch daily log for this date so consumed meals show as filled
    useEffect(() => {
        getDailyLog(day.date)
    }, [day.date, getDailyLog])

    // Wrap context functions with day.date for convenience
    const isConsumed = (mealName: string) => isConsumedCtx(day.date, mealName)
    const addMeal = (mealName: string, calories: number, mealId: string) => addMealCtx(day.date, mealName, calories, mealId)
    const removeMeal = (mealName: string) => removeMealCtx(day.date, mealName)
    const [showAuthDrawer, setShowAuthDrawer] = useState(false)
    const [showCalorieGoalModal, setShowCalorieGoalModal] = useState(false)
    const [pendingMeal, setPendingMeal] = useState<{ name: string; calories: number; id: string } | null>(null)
    const [showComments, setShowComments] = useState(false)

    useEffect(() => {
        if (autoOpenComments) {
            setShowComments(true)
            onCommentsOpened?.()
        }
    }, [autoOpenComments, onCommentsOpened])
    const [commentCount, setCommentCount] = useState<number | null>(null)
    const noData = day.meals.length === 0
    const prompt = generateAiPrompt(day)

    useEffect(() => {
        fetch(`/api/comments?menuDate=${day.date}&count=true`)
            .then((r) => r.json())
            .then((d) => setCommentCount(d.count ?? 0))
            .catch(() => setCommentCount(0))
    }, [day.date])

    const handleFavoriteClick = async (e: React.MouseEvent, mealName: string, mealId?: string) => {
        e.stopPropagation()
        if (!session) {
            setShowAuthDrawer(true)
            return
        }
        const result = await toggleFavorite(mealName, mealId)
        if (!result) {
            toast.error("Bir hata oluştu", { duration: 2000 })
        } else if (result.action === "removed") {
            toast.success(`${mealName} favorilerden çıkarıldı`, { duration: 2000 })
        } else {
            toast.success(
                result.emailOptedIn
                    ? `${mealName} favorilere eklendi. Menüde olduğunda e-posta ile haber vereceğiz.`
                    : `${mealName} favorilere eklendi.`,
                { duration: result.emailOptedIn ? 4000 : 2000 }
            )
        }
    }

    const handleAddMealClick = async (e: React.MouseEvent, mealName: string, calories: number, mealId: string) => {
        e.stopPropagation()
        if (!session) {
            setShowAuthDrawer(true)
            return
        }
        const consumed = isConsumed(mealName)
        if (consumed) {
            const success = await removeMeal(mealName)
            if (success) {
                toast.success(`${mealName} günlükten çıkarıldı`, { duration: 2000 })
            } else {
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        } else {
            // Gelecek tarih kontrolü
            const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }))
            today.setHours(0, 0, 0, 0)
            const menuDate = new Date(day.date + "T00:00:00")
            if (menuDate > today) {
                toast.error("Henüz günü gelmemiş bir yemeği ekleyemezsiniz.", {
                    description: "Yalnızca bugün veya geçmiş tarihlerdeki yemekleri günlüğünüze ekleyebilirsiniz.",
                    duration: 3000,
                })
                return
            }

            if (needsGoal) {
                setPendingMeal({ name: mealName, calories, id: mealId })
                setShowCalorieGoalModal(true)
                return
            }
            const success = await addMeal(mealName, calories, mealId)
            if (success) {
                toast.success(`${mealName} (${calories} kcal) günlüğünüze eklendi`, { duration: 2000 })
            } else {
                toast.error("Bir hata oluştu", { duration: 2000 })
            }
        }
    }

    const handleCalorieGoalSet = async (goal: number) => {
        const success = await setCalorieGoal(goal)
        if (success) {
            toast.success(`Kalori hedefi ${goal} kcal olarak belirlendi`, { duration: 2000 })
            // Add the pending meal after setting goal
            if (pendingMeal) {
                const mealSuccess = await addMeal(pendingMeal.name, pendingMeal.calories, pendingMeal.id)
                if (mealSuccess) {
                    toast.success(`${pendingMeal.name} (${pendingMeal.calories} kcal) günlüğünüze eklendi`, { duration: 2000 })
                }
                setPendingMeal(null)
            }
        } else {
            toast.error("Kalori hedefi kaydedilemedi", { duration: 2000 })
        }
    }

    return (
        <Card className="bg-card overflow-hidden gap-0">
            {/* Header */}
            <div className="bg-muted/20 px-3 py-2 border-b border-border/40 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 overflow-hidden" style={{ maskImage: 'linear-gradient(to right, black 85%, transparent)' }}>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="text-lg font-semibold text-foreground tracking-tight">
                            {formatDayName(day.date)}
                        </div>
                        <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-2 text-muted-foreground bg-secondary/50 shrink-0">
                            {formatDateShort(day.date)}
                        </Badge>
                    </div>
                    {!noData && (
                        <p className="text-xs text-muted-foreground/60 leading-none mt-0.5">
                            Yemek verileri son dakika değiştirilmiş olabilir.
                        </p>
                    )}
                </div>
                <div className={cn("shrink-0", noData && "opacity-20")} inert={noData || undefined}>
                    <LikeDislikeButtons menuDate={day.date} />
                </div>
            </div>

            {/* Meals Table or No-Data Message */}
            {day.meals.length > 0 ? (
                <div className="-my-px overflow-hidden">
                    <Table className="table-fixed w-full">
                        <TableBody>
                            {day.meals.map((meal, idx) => (
                                <TableRow
                                    key={idx}
                                    className="group border-border/40 hover:bg-muted/30 cursor-pointer last:border-b-0"
                                    onClick={() => onMealClick(meal.id, meal.name, meal.calories)}
                                >
                                    <TableCell className="py-2.5 px-3 font-medium text-sm text-foreground overflow-hidden" style={{ maskImage: 'linear-gradient(to right, black 80%, transparent)' }}>
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <MealAllergenMark
                                                allergens={meal.allergens}
                                                unmapped={meal.unmappedIngredients}
                                                userAllergens={allergenPrefs.allergens}
                                                includeProbable={allergenPrefs.includeProbable}
                                                dietFlags={meal.dietFlags}
                                                dietPreference={allergenPrefs.dietPreference}
                                            />
                                            {toTitleCase(meal.name)}
                                            {day.meals.length === 5 && idx === 0 && (
                                                <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-2 text-muted-foreground bg-secondary/50 shrink-0">
                                                    Ana Yemek
                                                </Badge>
                                            )}
                                            {day.meals.length === 5 && idx === 1 && (
                                                <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-2 text-muted-foreground bg-secondary/50 shrink-0">
                                                    Seçenek
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        className="py-2.5 px-3 text-right whitespace-nowrap"
                                        style={{ width: nudgeActive ? CALORIE_COLUMN_WIDTH_NUDGE : CALORIE_COLUMN_WIDTH }}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            <CalorieNudgeBadge
                                                calories={meal.calories}
                                                mealName={toTitleCase(meal.name)}
                                                active={nudgeActive && idx === 0}
                                                onClick={() => onMealClick(meal.id, meal.name, meal.calories)}
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground/70 hover:text-foreground"
                                                        aria-label="Seçenekler"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel className="text-xs font-semibold">İşlemi Seçin</DropdownMenuLabel>
                                                    <p className="px-2 pb-1.5 text-[12px] text-muted-foreground/60 leading-tight">
                                                        Yapmak istediğiniz işlemi seçin.
                                                    </p>
                                                    <DropdownMenuItem asChild>
                                                        <motion.button
                                                            className="cursor-pointer group w-full"
                                                            whileHover="hover"
                                                            onClick={(e) => { e.stopPropagation(); handleFavoriteClick(e, meal.name, meal.id); }}
                                                        >
                                                            <Bookmark className={cn("h-4 w-4", isFavorited(meal.name) ? "text-foreground fill-foreground" : "text-foreground/80")} />
                                                            <span className="text-xs text-foreground/80">
                                                                {isFavorited(meal.name) ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                                                            </span>
                                                            <motion.span
                                                                className="ml-auto"
                                                                variants={{ hover: { opacity: 1, x: 0 } }}
                                                                initial={{ opacity: 0, x: -4 }}
                                                                transition={{ duration: 0.15 }}
                                                            >
                                                                <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />
                                                            </motion.span>
                                                        </motion.button>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <motion.button
                                                            className="cursor-pointer group w-full"
                                                            whileHover="hover"
                                                            onClick={(e) => { e.stopPropagation(); handleAddMealClick(e, meal.name, meal.calories, meal.id); }}
                                                        >
                                                            {isConsumed(meal.name) ? (
                                                                <CircleCheck className="h-4 w-4 text-foreground" />
                                                            ) : (
                                                                <CirclePlus className="h-4 w-4 text-foreground/80" />
                                                            )}
                                                            <span className="text-xs text-foreground/80">
                                                                {isConsumed(meal.name) ? "Günlükten Çıkar" : "Günlüğe Ekle"}
                                                            </span>
                                                            <motion.span
                                                                className="ml-auto"
                                                                variants={{ hover: { opacity: 1, x: 0 } }}
                                                                initial={{ opacity: 0, x: -4 }}
                                                                transition={{ duration: 0.15 }}
                                                            >
                                                                <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />
                                                            </motion.span>
                                                        </motion.button>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Tatil günlerinde Üniversite Merkezi Kafeterya&apos;sı hizmet vermemektedir.
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className={cn("border-t border-border/40 bg-muted/50 px-3 py-2 flex items-center justify-between gap-2", noData && "opacity-20")} inert={noData || undefined}>
                {/* Sol: Yorumlar, Kalori, AI */}
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 px-2.5 border-border/40"
                        onClick={() => setShowComments(true)}
                        aria-label="Yorumlar"
                        title="Yorumlar"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-medium">Yorumlar</span>
                        {commentCount === null ? (
                            <span className="h-4 w-6 rounded bg-muted-foreground/20 animate-pulse" />
                        ) : commentCount > 0 ? (
                            <span className="inline-flex items-center justify-center rounded px-1 py-0 text-[10px] font-semibold tabular-nums bg-muted text-muted-foreground/70 leading-4 min-w-[20px]">
                                {commentCount}
                            </span>
                        ) : null}
                    </Button>

                    {/* AI Dropdown */}
                    <AiPromptMenu
                        prompt={prompt}
                        description="Menüyü yapay zekaya yorumlatarak fikir edinin."
                    >
                        <Button
                            suppressHydrationWarning
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 border-border/40 transition-colors"
                            title="Menüyü yapay zekaya yorumlat"
                        >
                            <Brain className="w-3.5 h-3.5" />
                        </Button>
                    </AiPromptMenu>

                    {/* Kalori Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                suppressHydrationWarning
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 border-border/40 transition-colors"
                                title="Toplam Kalori"
                            >
                                <KcalIcon
                                    className={`w-3.5 h-3.5`}
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel className="text-xs font-semibold">Toplam Kalori</DropdownMenuLabel>
                            <p className="px-2 pb-1.5 text-[12px] text-muted-foreground/60 leading-tight">
                                Bu menünün toplam kalorisi,
                                {" "}
                                <span
                                    className={`inline-block w-2 h-2 rounded-full align-middle ${day.totalCalories < 800
                                        ? 'bg-green-500'
                                        : day.totalCalories < 1100
                                            ? 'bg-amber-500'
                                            : 'bg-red-500'
                                        }`}
                                />
                                {" "}
                                <span className="font-mono font-semibold text-foreground/80">{day.totalCalories}</span>
                                {" kcal şeklindedir."}
                            </p>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Sağ: Share */}
                <MenuShareButton day={day} />
            </div>

            {/* Auth Drawer for unauthenticated users */}
            <AuthModal
                open={showAuthDrawer}
                onOpenChange={setShowAuthDrawer}
            />

            {/* Calorie Goal Modal */}
            <CalorieGoalModal
                open={showCalorieGoalModal}
                onOpenChange={(open) => {
                    setShowCalorieGoalModal(open)
                    if (!open) setPendingMeal(null)
                }}
                currentGoal={calorieGoal}
                onGoalSet={handleCalorieGoalSet}
            />

            {/* Comments Panel */}
            <CommentsPanel
                open={showComments}
                onOpenChange={(open) => {
                    setShowComments(open)
                    if (!open) {
                        // Panel kapandığında sayacı güncelle
                        fetch(`/api/comments?menuDate=${day.date}&count=true`)
                            .then((r) => r.json())
                            .then((d) => setCommentCount(d.count ?? 0))
                            .catch(() => { })
                    }
                }}
                menuDate={day.date}
            />
        </Card>
    )
}
