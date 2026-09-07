"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AiPromptGrid } from "@/components/ai-prompt-menu"
import { AlertCircle, Info } from "lucide-react"
import { useMediaQuery } from "../hooks/use-media-query"
import Image from "next/image"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { Ingredient, MealDetail } from "@/lib/types"
import { toTitleCase } from "@/lib/utils"
import { computeMealAllergens, filterHitsForUser, normalizeIngredient } from "@/lib/allergens"
import { AllergenDisclaimer, AllergenStrip } from "@/components/allergen-info"
import { AllergenNudgeCard } from "@/components/allergen-nudge"
import { useAllergenPreferences } from "@/hooks/use-allergen-preferences"
import { useAllergenNudge } from "@/hooks/use-allergen-nudge"

/**
 * /api/meal/[id] yanıtı: detay + tazelik bilgisi.
 * `stale` yalnızca üniversitenin sitesine ulaşılamadığında true olur; o durumda
 * son bilinen veri gösterilir ve kullanıcıya bunun bayat olduğu SÖYLENİR.
 */
interface MealDetailResponse extends MealDetail {
    fetchedAt?: string
    stale?: boolean
}

interface MealDetailProps {
    mealId: string
    mealName: string
    mealCalories: number
    open: boolean
    onOpenChange: (open: boolean) => void
}



/** "12 dakika önce" / "3 saat önce" — bayat verinin yaşını insan diliyle söyler. */
function formatAge(iso?: string): string {
    if (!iso) return "daha önce"
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (!Number.isFinite(minutes) || minutes < 1) return "az önce"
    if (minutes < 60) return `${minutes} dakika önce`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.floor(hours / 24)
    return `${days} gün önce`
}

/**
 * Öğün için hazır istem. Menü kartındakinin tek yemeğe inmiş hâli: aynı üç
 * karakter, ama elde malzeme listesi de olduğu için model tahmin yürütmek
 * yerine gerçek reçeteye bakabiliyor.
 */
function generateMealAiPrompt(
    name: string,
    calories: number,
    ingredients: Ingredient[] | null
): string {
    const ingredientLines = ingredients?.length
        ? ingredients.map((i) => `- ${i.name}: ${i.amount} ${i.unit}`).join("\n")
        : "(Malzeme listesi bulunamadı)"

    return `Çukurova Üniversitesi yemekhanesi menüsünü en iyi bilen yapay zeka sensin. Aşağıdaki tek öğünü incele ve şu üç farklı karakter gibi yorumla:

1. **Şüpheci Diyetisyen:** Bu öğündeki "gizli tehlikeleri" veya "sağlıklı yanları" esprili bir dille anlat.
2. **Gym Rat (Sporcu):** "Bu öğün basmak için yeterli mi?" sorusuna odaklan. Protein durumunu sorgula.
3. **Vize Haftasındaki Öğrenci:** Sadece şuna odaklan: Bu yemek beni mutlu eder mi, doyurur mu ve uyku bastırır mı?

Öğün: ${name}
Kalori: ${calories} kcal
Malzemeler (bir porsiyon için):
${ingredientLines}`
}

/**
 * Kalori rozeti: çerçevesiz, rengi yalnızca zeminde. Cümlenin içinde aktığı
 * için mümkün olduğunca kompakt — satır yüksekliğini bozmaz.
 */
function getCalorieBadgeClasses(calories: number): string {
    const baseClasses =
        "font-mono border-transparent rounded px-1 py-0 text-[10px] leading-4 align-middle"
    if (calories < 800) {
        // Yeşil - düşük kalori
        return `${baseClasses} text-green-700 dark:text-green-400 bg-green-500/15`
    }
    if (calories < 1100) {
        // Turuncu - orta kalori
        return `${baseClasses} text-amber-700 dark:text-amber-400 bg-amber-500/15`
    }
    // Kırmızı - yüksek kalori
    return `${baseClasses} text-red-700 dark:text-red-400 bg-red-500/15`
}

/**
 * Görselin üstündeki arama bağlantısı. Etiket butona sığmıyorsa metin butonun
 * içinde kayar; sığıyorsa animasyon hiç çalışmaz — sürekli kayan, sığan bir
 * metin sadece gürültü olurdu.
 */
function GoogleImageSearchLink({ query }: { query: string }) {
    const viewportRef = useRef<HTMLSpanElement>(null)
    const labelRef = useRef<HTMLSpanElement>(null)
    const [needsMarquee, setNeedsMarquee] = useState(false)
    const label = "Google Görseller ile Ara"

    useEffect(() => {
        const viewport = viewportRef.current
        const measure = () => {
            const el = viewportRef.current
            const text = labelRef.current
            if (!el || !text) return
            setNeedsMarquee(text.offsetWidth > el.clientWidth + 1)
        }

        measure()
        if (!viewport || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measure)
        observer.observe(viewport)
        return () => observer.disconnect()
    }, [])

    return (
        // Model butonlarıyla aynı kalıp: outline + h-7. Fotoğrafın üstünde
        // durduğu için zemin her iki temada da opak sabitleniyor; outline
        // varyantı karanlık temada `bg-input/30` ile yarı saydam geliyor.
        <Button
            asChild
            size="sm"
            variant="outline"
            className="absolute right-1.5 bottom-1.5 h-7 w-[35%] min-w-[5.5rem] justify-start gap-1.5 border-border/40 bg-background px-2 text-xs shadow-sm hover:bg-accent dark:bg-background dark:hover:bg-accent"
        >
            <a
                href={`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
            >
                <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span
                    ref={viewportRef}
                    aria-hidden="true"
                    className={
                        needsMarquee ? "marquee min-w-0 flex-1" : "min-w-0 flex-1 overflow-hidden"
                    }
                >
                    <span className={needsMarquee ? "marquee-track" : "block"}>
                        <span ref={labelRef} className="whitespace-nowrap">
                            {label}
                        </span>
                        {needsMarquee && <span className="whitespace-nowrap">{label}</span>}
                    </span>
                </span>
            </a>
        </Button>
    )
}

function MealDetailContent({
    mealId,
    mealName,
    mealCalories,
    onRequestClose,
}: Omit<MealDetailProps, "open" | "onOpenChange"> & { onRequestClose: () => void }) {
    const [mealDetail, setMealDetail] = useState<MealDetailResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Model butonlarının grubu başlığına bu id ile bağlanıyor; sunucu ve
    // istemcide aynı olsun diye useId.
    const aiSectionId = useId()

    // Alerjen arayüzü yalnızca alerjen seçmiş kullanıcıya gösterilir.
    const { preferences, hasAllergenSelection, showsWarnings } = useAllergenPreferences()

    // Tercih yapmamış (ve dürtmeyi reddetmemiş) kullanıcıya, alerjen şeridinin
    // duracağı yerde tercihe yönlendiren bir katman çıkar.
    const { isEligible: showAllergenNudge } = useAllergenNudge()

    useEffect(() => {
        async function fetchMealDetail() {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(`/api/meal/${mealId}`)

                if (!response.ok) {
                    throw new Error('Yemek detayı yüklenemedi')
                }

                const data: MealDetailResponse = await response.json()
                setMealDetail(data)
            } catch (err) {
                console.error('Error fetching meal detail:', err)
                setError(err instanceof Error ? err.message : 'Bir hata oluştu')
            } finally {
                setIsLoading(false)
            }
        }

        fetchMealDetail()
    }, [mealId])

    /**
     * Malzeme listesi /api/meal/[id]'den gelir; menü JSON'undaki kopya burada
     * bilinçli olarak KULLANILMAZ.
     *
     * Sebep: yemekhane, ID'yi değiştirmeden reçeteyi güncelleyebiliyor
     * (ALERJENPLANI K3) ve menü JSON'u günde bir kez üretiliyor — oradan
     * okumak 24 saate kadar bayat alerjen uyarısı demek.
     *
     * Sunucu tarafında 15 dakikalık önbellek var (lib/meal-detail-cache.ts);
     * bayatlık penceresi bir öğle arasının altında. Site kapalıysa son bilinen
     * veri `stale: true` ile gelir ve yukarıda ETİKETLENİR; hiçbir şey
     * uydurulmaz — AllergenStrip "yüklenemedi" der, "alerjen yok" demez.
     */
    const ingredients: Ingredient[] | null = mealDetail?.ingredients ?? null

    const allergenData = useMemo(() => {
        if (!ingredients) return null
        return computeMealAllergens(ingredients.map((i) => i.name))
    }, [ingredients])

    /**
     * Malzeme satırı vurgusu — yalnızca KULLANICININ alerjenlerini tetikleyen
     * satırlar. Alerjen seçmemiş kullanıcıda tablo hiç değişmez.
     */
    const triggeringIngredients = useMemo(() => {
        const set = new Set<string>()
        if (!hasAllergenSelection) return set

        const matched = filterHitsForUser(
            allergenData?.allergens ?? [],
            preferences.allergens,
            preferences.includeProbable
        )
        for (const hit of matched) {
            for (const name of hit.from) set.add(name)
        }
        for (const name of allergenData?.unmapped ?? []) set.add(name)
        return set
    }, [allergenData, hasAllergenSelection, preferences])

    // Malzeme listesi hiç gelmediyse hata durumu.
    if (error && !ingredients) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <div className="text-center">
                        <p className="text-sm font-medium">{error}</p>
                        <p className="text-xs text-muted-foreground mt-1">Lütfen daha sonra tekrar deneyin</p>
                    </div>
                </div>
                {showsWarnings ? (
                    <>
                        <AllergenStrip
                            allergens={[]}
                            unmapped={[]}
                            hasIngredients={false}
                            unavailable
                            userAllergens={preferences.allergens}
                            includeProbable={preferences.includeProbable}
                            dietPreference={preferences.dietPreference}
                        />
                        <AllergenDisclaimer />
                    </>
                ) : showAllergenNudge ? (
                    <AllergenNudgeCard onNavigate={onRequestClose} />
                ) : null}
            </div>
        )
    }

    // Use the fetched data or fallback to props
    const displayCalories = mealDetail?.calories ?? mealCalories
    const displayName = toTitleCase(mealName)

    const ingredientsLoading = isLoading

    return (
        <div className="space-y-5 md:space-y-6">
            {/* Künye: solda 1:1 görsel, sağında yemek adı ve kalorisi. */}
            {/* items-stretch + görselde self-start: satırın yüksekliğini kare
                görsel belirler, sağdaki sütun o yüksekliğe uzar. Model
                butonları böylece görselin alt kenarıyla hizalanabiliyor. */}
            <div className="flex items-stretch gap-3 md:gap-4">
                <div className="relative aspect-square w-2/5 shrink-0 self-start overflow-hidden rounded-lg bg-muted">
                    {isLoading ? (
                        <Skeleton className="w-full h-full" />
                    ) : mealDetail?.imageUrl ? (
                        // Kutu büyümeden görselin büyümesi: kareyi boşluksuz
                        // doldur, artan kenarı kırp.
                        <Image
                            src={mealDetail.imageUrl}
                            alt={displayName}
                            fill
                            sizes="(min-width: 768px) 16rem, 36vw"
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center p-3">
                                <div className="text-2xl md:text-3xl mb-1">🍽️</div>
                                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                                    Fotoğraf bulunamadı
                                </p>
                            </div>
                        </div>
                    )}
                    {!isLoading && <GoogleImageSearchLink query={mealName} />}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {/* Optik hizalama: satır kutusunun üstündeki boşluk yüzünden
                        harfler görselin üst kenarından birkaç piksel aşağıda
                        başlıyordu; sıkı satır aralığı + küçük negatif kaydırma
                        ile büyük harfin tepesi kenarla aynı hizaya geliyor. */}
                    <h3 className="-mt-0.5 text-base md:text-lg font-semibold leading-tight text-pretty">
                        {displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                        Bu öğünün kalorisi{" "}
                        <Badge className={getCalorieBadgeClasses(displayCalories)}>
                            {displayCalories} kcal
                        </Badge>{" "}
                        değerindedir.
                    </p>

                    {/* Yorum istemi malzeme listesini de taşıyor; liste gelene
                        kadar butonlar beklemede, yoksa modele eksik reçete
                        gider. */}
                    {/* Dört bağlantı kendi bölümü: "İçindekiler" gibi görünür
                        bir başlığı var, grup da o başlığa bağlı. */}
                    {/* Boşluk margin ile değil gap ile: `not-sr-only`
                        margin'i sıfırlıyor, space-y kullanılsa başlık
                        butonlara yapışıyor. Gizliyken (position:absolute)
                        başlık gap'te yer kaplamıyor. */}
                    <div
                        className="mt-auto flex flex-col gap-1.5"
                        role="group"
                        aria-labelledby={aiSectionId}
                    >
                        {/* Dar ekranda başlık gizleniyor ama SİLİNMİYOR: grup
                            adını buradan alıyor, ekran okuyucuda kalmalı. */}
                        <h4
                            id={aiSectionId}
                            className="sr-only md:not-sr-only text-xs font-medium text-muted-foreground"
                        >
                            Yapay Zeka ile Yorumla
                        </h4>
                        {ingredientsLoading ? (
                            <div className="grid grid-cols-2 gap-1.5">
                                <Skeleton className="h-7" />
                                <Skeleton className="h-7" />
                                <Skeleton className="h-7" />
                                <Skeleton className="h-7" />
                            </div>
                        ) : (
                            <AiPromptGrid
                                prompt={generateMealAiPrompt(displayName, displayCalories, ingredients)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Bayat veri uyarısı. Alerjen tercihinden BAĞIMSIZ: malzeme
                tablosunun tamamı eski, bu herkesi ilgilendiriyor. */}
            {!isLoading && mealDetail?.stale && (
                <div className="flex gap-2 rounded-md border border-border bg-muted/40 p-2.5">
                    <Info className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
                    <p className="text-xs text-muted-foreground text-pretty">
                        Yemekhanenin sitesine şu an ulaşılamıyor. Aşağıdakiler{" "}
                        <strong>{formatAge(mealDetail.fetchedAt)}</strong> alınmış son
                        bilinen bilgiler; reçete o zamandan beri değişmiş olabilir.
                    </p>
                </div>
            )}

            {/* Alerjen şeridi — malzeme tablosunun ÜSTÜNDE.
                Yalnızca alerjen seçmiş kullanıcıya görünür. Seçmemiş kullanıcı
                aynı yerde tercihe yönlendiren CTA'yı görür: kutu, tercihi
                yapınca ne göreceğini tam olarak duracağı yerde vaat ediyor.
                CTA veriden bağımsız olduğu için malzeme yüklenmesini beklemez. */}
            {showsWarnings ? (
                ingredientsLoading ? (
                    <Skeleton className="h-20 w-full" />
                ) : (
                    <AllergenStrip
                        allergens={allergenData?.allergens ?? []}
                        unmapped={allergenData?.unmapped ?? []}
                        hasIngredients={Boolean(ingredients && ingredients.length > 0)}
                        unavailable={!allergenData}
                        userAllergens={preferences.allergens}
                        includeProbable={preferences.includeProbable}
                        dietFlags={allergenData?.dietFlags}
                        dietPreference={preferences.dietPreference}
                    />
                )
            ) : showAllergenNudge ? (
                <AllergenNudgeCard onNavigate={onRequestClose} />
            ) : null}

            {/* Ingredients Table */}
            <div>
                <h4 className="text-sm font-semibold mb-3 md:mb-3 text-muted-foreground">İçindekiler</h4>
                {ingredientsLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : ingredients && ingredients.length > 0 ? (
                    <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-3 md:px-4 py-2.5 md:py-2">
                                        Malzeme
                                    </th>
                                    <th className="text-right text-xs font-medium text-muted-foreground px-3 md:px-4 py-2.5 md:py-2">
                                        Miktar
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map((ingredient, idx) => {
                                    const isTrigger = triggeringIngredients.has(
                                        normalizeIngredient(ingredient.name)
                                    )
                                    return (
                                        <tr
                                            key={idx}
                                            className={
                                                isTrigger
                                                    ? "border-t border-border bg-amber-500/10 transition-colors"
                                                    : "border-t border-border hover:bg-muted/30 transition-colors"
                                            }
                                        >
                                            <td className="px-3 md:px-4 py-3 md:py-2.5 text-sm font-medium">
                                                {ingredient.name}
                                            </td>
                                            <td className="px-3 md:px-4 py-3 md:py-2.5 text-sm text-muted-foreground text-right font-mono">
                                                {ingredient.amount} {ingredient.unit}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        Malzeme bilgisi bulunamadı
                    </div>
                )}
            </div>

            {/* Sorumluluk reddi — alerjen bilgisi gösterildiyse zorunlu (8.4) */}
            {showsWarnings && (
                <AllergenDisclaimer className="border-t border-border pt-4" />
            )}
        </div>
    )
}

export function MealDetailModal({ mealId, mealName, mealCalories, open, onOpenChange }: MealDetailProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Öğün Detayları</DialogTitle>
                    </DialogHeader>
                    <MealDetailContent mealId={mealId} mealName={mealName} mealCalories={mealCalories} onRequestClose={() => onOpenChange(false)} />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh] px-4 pb-6">
                <DrawerHeader className="px-0 pt-2 pb-4">
                    <DrawerTitle className="text-lg font-semibold">Öğün Detayları</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-1 -mx-1">
                    <MealDetailContent mealId={mealId} mealName={mealName} mealCalories={mealCalories} onRequestClose={() => onOpenChange(false)} />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
