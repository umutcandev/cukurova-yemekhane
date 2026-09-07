"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AllergenDisclaimer } from "@/components/allergen-info"
import {
    useAllergenPreferences,
    type DietPreference,
} from "@/hooks/use-allergen-preferences"
import { ALLERGEN_LABELS, ALLERGEN_ORDER, type AllergenId } from "@/lib/allergens"
import { cn } from "@/lib/utils"

const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
    { value: "none", label: "Farketmez" },
    { value: "vegetarian", label: "Vejetaryen" },
    { value: "vegan", label: "Vegan" },
]

/** Sağdaki kontrolün genişliği — Select ve alerjen tetikleyicisi aynı hizada. */
const CONTROL = "h-8 w-32 shrink-0 text-xs sm:w-40"

/**
 * Bildirim ve gizlilik kartlarıyla aynı kabuk: p-3, metin solda, kontrol sağda,
 * başlık text-sm/medium + açıklama text-xs.
 *
 * Bu bölüm daha önce kendi kart dilini taşıyordu (px-4 py-4 gövde + ayrı
 * aksiyon şeridi). Aynı sayfada iki farklı kart ritmi okunuyordu; kartlar da
 * gereksiz uzundu. Kaydet şeridi kalktığı için tercihler artık switch'ler gibi
 * ANINDA kaydediliyor.
 */
function SettingCard({
    title,
    description,
    children,
}: {
    title: string
    description: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <Card className="bg-card p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                        {description}
                    </p>
                </div>
                {children}
            </div>
        </Card>
    )
}

function sameSet(a: readonly string[], b: readonly string[]) {
    return a.length === b.length && a.every((item) => b.includes(item))
}

/**
 * Yemek detayındaki CTA "/ayarlar?vurgu=alerjen" adresine gönderiyor.
 * Kullanıcı birkaç bölümün olduğu bir ayarlar sayfasına düşüyor; hangi bölüm
 * için geldiğini kendisi aramasın diye bölüme kaydırıp kısa bir süre
 * çerçeveliyoruz. Kaydırma bölümün kendi ref'i üzerinden yapılır, yani
 * bölümlerin sırası değişse de hedef doğru kalır.
 *
 * Parametre `useSearchParams` ile değil `window.location` ile okunuyor:
 * useSearchParams bu client sayfasına bir Suspense sınırı zorunlu kılardı,
 * oysa burada tek seferlik bir yan etki var.
 */
const HIGHLIGHT_PARAM = "vurgu"
const HIGHLIGHT_VALUE = "alerjen"

/**
 * Vurgunun sönmesi zamanlayıcıyla DEĞİL, tek sefer oynayıp şeffaflıkta biten
 * `.section-highlight` animasyonuyla yapılıyor (globals.css). Burada state'i
 * geri almak zorunda olsaydık, efektin ikinci kez çalıştığı her durumda —
 * StrictMode dahil — çerçeve ekranda kalıcı olarak asılı kalırdı.
 */
function useTargetHighlight(ref: React.RefObject<HTMLElement | null>) {
    const [highlighted, setHighlighted] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get(HIGHLIGHT_PARAM) !== HIGHLIGHT_VALUE) return

        // Adresi temizle: sayfa yenilenince aynı vurgu tekrar oynamasın.
        params.delete(HIGHLIGHT_PARAM)
        const query = params.toString()
        window.history.replaceState(
            null,
            "",
            window.location.pathname + (query ? `?${query}` : "")
        )

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ref.current?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "center",
        })
        setHighlighted(true)
    }, [ref])

    return highlighted
}

/**
 * Sorumluluk reddi başlığın sağ ucunda, tek bir uyarı ikonunun arkasında.
 * Metnin tamamı sarı bir blok olarak açıkta dursa bölümü bastırırdı; dipnota
 * inince de bölümün başında hiç görünmüyordu.
 */
function DisclaimerButton() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Alerjen bilgisi hakkında uyarı"
                    className="size-6 shrink-0 rounded-full border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                >
                    <AlertTriangle className="size-3.5" strokeWidth={2} />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-[min(22rem,calc(100vw-2rem))] p-3"
            >
                <div className="flex gap-2">
                    <AlertTriangle
                        className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden="true"
                    />
                    <AllergenDisclaimer />
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function AllergenSection() {
    const { preferences, isLoading, save, hasAllergenSelection } =
        useAllergenPreferences()

    const sectionRef = useRef<HTMLElement | null>(null)
    const highlighted = useTargetHighlight(sectionRef)

    // ── Alerjen taslağı ──────────────────────────────────────────────────────
    // Tek tek 14 POST atmamak için seçim popover içinde taslakta tutulur ve
    // popover KAPANIRKEN tek istekte kaydedilir. Kartta dirty göstergesi yok;
    // taslağın kapanışta kaydedilmesi, kaydedilmemiş bir seçimin sessizce
    // kaybolmasından iyidir.
    const savedAllergens = preferences.allergens
    const savedAllergenKey = [...savedAllergens].sort().join(",")
    const [allergenDraft, setAllergenDraft] = useState<AllergenId[]>(savedAllergens)
    const [syncedAllergenKey, setSyncedAllergenKey] = useState(savedAllergenKey)
    const [savingAllergens, setSavingAllergens] = useState(false)
    const [pickerOpen, setPickerOpen] = useState(false)

    // Sunucudan gelen değer değiştiyse (ilk yükleme / kayıt / hata sonrası geri
    // alma) taslağı hizala. Render sırasında set etmek, bir kare eski veriyi
    // göstermekten iyi.
    if (syncedAllergenKey !== savedAllergenKey) {
        setSyncedAllergenKey(savedAllergenKey)
        setAllergenDraft(savedAllergens)
    }

    const [savingDiet, setSavingDiet] = useState(false)
    const [pendingSwitch, setPendingSwitch] = useState<string | null>(null)

    const toggleSwitch = async (
        key: "includeProbable" | "notifyAllergens",
        value: boolean,
        successMsg: string
    ) => {
        setPendingSwitch(key)
        const ok = await save({ [key]: value })
        setPendingSwitch(null)
        if (ok) toast.success(successMsg)
        else toast.error("Ayar güncellenemedi.")
    }

    const toggleAllergen = (id: AllergenId) => {
        setAllergenDraft((current) =>
            current.includes(id)
                ? current.filter((a) => a !== id)
                : // Sözlük sırasını koru: rozetler her yerde aynı sırada çıksın.
                  ALLERGEN_ORDER.filter((a) => a === id || current.includes(a))
        )
    }

    /** Popover kapanışında yalnızca değişiklik varsa yazar. */
    const handlePickerOpenChange = async (open: boolean) => {
        setPickerOpen(open)
        if (open || sameSet(allergenDraft, savedAllergens)) return

        const next = allergenDraft
        setSavingAllergens(true)
        const ok = await save({ allergens: next })
        setSavingAllergens(false)

        if (ok) {
            toast.success(
                next.length > 0
                    ? "Alerjen tercihleriniz kaydedildi."
                    : "Alerjen uyarıları kapatıldı."
            )
        } else {
            // Hook eski değeri geri yayınlar; taslak yukarıdaki senkronla döner.
            toast.error("Alerjen tercihleri kaydedilemedi.")
        }
    }

    const changeDiet = async (value: DietPreference) => {
        setSavingDiet(true)
        const ok = await save({ dietPreference: value })
        setSavingDiet(false)
        if (ok) toast.success("Beslenme tercihi kaydedildi.")
        else toast.error("Beslenme tercihi kaydedilemedi.")
    }

    // Kontrol dar (128px); uzun etiket yerine sayı göster.
    const triggerLabel =
        allergenDraft.length === 0
            ? "Seçilmedi"
            : allergenDraft.length === 1
                ? ALLERGEN_LABELS[allergenDraft[0]]
                : `${allergenDraft.length} alerjen`

    return (
        <section
            ref={sectionRef}
            id="alerjen-tercihleri"
            // Vurgu box-shadow ile: düzeni itmeden bölümün dışında durur ve
            // bir kez oynayıp kendiliğinden söner.
            className={cn(
                "scroll-mt-24 space-y-3 rounded-lg",
                highlighted && "section-highlight"
            )}
        >
            {/* İkon başlığın SAĞ UCUNDA: başlığın hemen bitişiğinde durunca
                başlığın parçası gibi okunuyor ve satırı uzatıyordu. */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    {/* Başlık ikisini birden kapsamalı: beslenme tercihi alerjen
                        DEĞİL. "Alerjenler" başlığı altında duran vegan seçeneğini
                        alerjisi olmayan kullanıcı hiç görmüyordu. */}
                    <h2 className="text-lg font-semibold text-foreground">
                        Beslenme ve Alerjenler
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5 text-pretty">
                        Menüde ve yemek detayında hangi yemeklerin işaretleneceğini
                        siz belirlersiniz.
                    </p>
                </div>
                <DisclaimerButton />
            </div>

            {/* Beslenme kartı alerjen kartından ÖNCE: üç seçenek, karar maliyeti
                düşük ve herkesi ilgilendiriyor. 14 kutuluk liste arkada kalsın. */}
            <SettingCard
                title="Beslenme tercihi"
                description="Reçetede et veya hayvansal ürün geçen yemekler işaretlenir."
            >
                <Select
                    value={preferences.dietPreference}
                    onValueChange={(v) => changeDiet(v as DietPreference)}
                    disabled={isLoading || savingDiet}
                >
                    <SelectTrigger size="sm" className={CONTROL}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                        {DIET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </SettingCard>

            <SettingCard
                title="Alerjen uyarıları"
                description="Seçmezseniz menüde ve yemek detayında alerjen bilgisi gösterilmez."
            >
                <Popover open={pickerOpen} onOpenChange={handlePickerOpenChange}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={pickerOpen}
                            disabled={isLoading || savingAllergens}
                            className={cn(CONTROL, "justify-between px-2.5 font-normal")}
                        >
                            <span
                                className={cn(
                                    "truncate",
                                    allergenDraft.length === 0 && "text-muted-foreground"
                                )}
                            >
                                {triggerLabel}
                            </span>
                            {savingAllergens ? (
                                <Loader2 className="size-3.5 shrink-0 animate-spin" />
                            ) : (
                                <ChevronsUpDown
                                    className="size-3.5 shrink-0 opacity-50"
                                    aria-hidden="true"
                                />
                            )}
                        </Button>
                    </PopoverTrigger>

                    {/* Genişlik sabit ve dar: tetikleyici 128px olduğu için ona
                        kilitlenemez, ama en uzun etiket ("Sert Kabuklu Yemiş")
                        12px'te ~112px — 208px bol bol yetiyor. Arama kutusu yok:
                        14 sabit seçenek için ekran klavyesi listenin yarısını
                        kapatırdı. */}
                    <PopoverContent align="end" className="w-52 p-0">
                        {/* Gerçek checkbox grubu: satırın tamamı tek dokunma
                            hedefi, her satır kendi başına Tab'lanır. Satır 32px —
                            WCAG'ın 24px alt sınırının üstünde ve satır tam
                            genişlikte, yani hedef alanı dar değil. */}
                        <div
                            role="group"
                            aria-label="Alerjenler"
                            className="max-h-[min(16rem,50vh)] overflow-y-auto p-1"
                        >
                            {ALLERGEN_ORDER.map((id) => (
                                <Label
                                    key={id}
                                    className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-1.5 text-xs font-normal hover:bg-accent hover:text-accent-foreground has-[:focus-visible]:bg-accent"
                                >
                                    <Checkbox
                                        checked={allergenDraft.includes(id)}
                                        onCheckedChange={() => toggleAllergen(id)}
                                    />
                                    {ALLERGEN_LABELS[id]}
                                </Label>
                            ))}
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-2 py-1.5">
                            <span className="text-xs text-muted-foreground">
                                {allergenDraft.length} seçili
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                disabled={allergenDraft.length === 0}
                                onClick={() => setAllergenDraft([])}
                            >
                                Temizle
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </SettingCard>

            {/* Bu iki ayar KAYDEDİLMİŞ seçime bağlı; taslak seçim onları açmaz.
                İkisi de beslenme tercihine DEĞİL alerjen seçimine bakar: gönderici
                yalnızca alerjen eşleşmesi varsa mail atıyor, beslenme çakışması tek
                başına mail sebebi değil (send-favorite-notifications.ts). Alerjen
                seçmemiş kullanıcıya bu switch gösterilirse çalışmayan bir düğme
                olur. */}
            {hasAllergenSelection && (
                <>
                    <SettingCard
                        title={`"İçerebilir" uyarılarını da göster`}
                        description="Hazır ürünlerin (puding, margarin, bulyon vb.) etiketinde görünmeyen ama içerebileceği alerjenler. Kapatırsanız yalnızca kesin eşleşmeler uyarı üretir."
                    >
                        <Switch
                            checked={preferences.includeProbable}
                            onCheckedChange={(v) =>
                                toggleSwitch(
                                    "includeProbable",
                                    v,
                                    v
                                        ? "\"İçerebilir\" uyarıları açıldı."
                                        : "Yalnızca kesin uyarılar gösterilecek."
                                )
                            }
                            disabled={isLoading || pendingSwitch === "includeProbable"}
                        />
                    </SettingCard>

                    <SettingCard
                        title="Alerjen e-posta uyarısı"
                        description="Günün menüsünde seçtiğiniz alerjenlerden biri varsa e-posta gönderilir; beslenme tercihinize aykırı yemekler de aynı e-postada listelenir. Favori bildiriminden bağımsızdır."
                    >
                        <Switch
                            checked={preferences.notifyAllergens}
                            onCheckedChange={(v) =>
                                toggleSwitch(
                                    "notifyAllergens",
                                    v,
                                    v
                                        ? "Alerjen e-postaları açıldı."
                                        : "Alerjen e-postaları kapatıldı."
                                )
                            }
                            disabled={isLoading || pendingSwitch === "notifyAllergens"}
                        />
                    </SettingCard>
                </>
            )}
        </section>
    )
}
