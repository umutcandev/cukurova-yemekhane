import { AlertCircle, AlertTriangle, Beef, HelpCircle, Info } from "lucide-react"
import { cn, toTitleCase } from "@/lib/utils"
import {
    ALLERGEN_LABELS,
    CONFIDENCE_LABELS,
    DIET_CONFLICT_LABELS,
    dietConflict,
    filterHitsForUser,
    type AllergenHit,
    type AllergenId,
    type Confidence,
    type DietFlags,
    type DietPreference,
} from "@/lib/allergens"

const CONFIDENCE_ICONS: Record<Confidence, typeof AlertTriangle> = {
    kesin: AlertTriangle,
    muhtemel: AlertCircle,
}

interface AllergenStripProps {
    allergens: AllergenHit[]
    /** Sözlükte bulunmayan malzemeler → "eksik veri" durumu */
    unmapped: string[]
    /** Yemekhane bu yemek için malzeme listesi yayınlamış mı? */
    hasIngredients: boolean
    /** Malzeme listesi hiç çekilemedi (site kapalı vb.) */
    unavailable?: boolean
    /** Kullanıcının seçtiği alerjenler — boşsa alerjen bloğu çizilmez */
    userAllergens: readonly AllergenId[]
    includeProbable: boolean
    /** Reçeteden türetilen et / hayvansal ürün işaretleri */
    dietFlags?: DietFlags
    dietPreference: DietPreference
    className?: string
}

function AllergenBadge({
    hit,
    muted = false,
}: {
    hit: AllergenHit
    muted?: boolean
}) {
    const kesin = hit.confidence === "kesin"
    const Icon = CONFIDENCE_ICONS[hit.confidence]

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
                muted
                    ? "border-border bg-muted/60 text-muted-foreground"
                    : kesin
                        ? "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-400"
                        : "border-amber-500/60 border-dashed bg-amber-500/10 text-amber-700 dark:text-amber-400"
            )}
        >
            {/* Sessiz kullanıcıda bile biçim farkı kalsın diye ikon muted'da da durur */}
            <Icon className="size-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>
                {ALLERGEN_LABELS[hit.id]}
                <span className="font-normal opacity-80">
                    {" "}
                    ({CONFIDENCE_LABELS[hit.confidence]})
                </span>
            </span>
        </span>
    )
}

function Notice({
    tone,
    children,
}: {
    tone: "neutral" | "amber"
    children: React.ReactNode
}) {
    const Icon = tone === "amber" ? HelpCircle : Info
    return (
        <div
            className={cn(
                "flex gap-2 rounded-md border p-2.5",
                tone === "amber"
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-border bg-muted/40"
            )}
        >
            <Icon
                className={cn(
                    "size-4 shrink-0",
                    tone === "amber"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                )}
                strokeWidth={1.5}
                aria-hidden="true"
            />
            <p
                className={cn(
                    "text-xs text-pretty",
                    tone === "amber"
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-muted-foreground"
                )}
            >
                {children}
            </p>
        </div>
    )
}

export function AllergenStrip({
    allergens,
    unmapped,
    hasIngredients,
    unavailable = false,
    userAllergens,
    includeProbable,
    dietFlags,
    dietPreference,
    className,
}: AllergenStripProps) {
    const wantsAllergens = userAllergens.length > 0
    const wantsDiet = dietPreference !== "none"

    // Ne alerjen ne diyet tercihi var → bu arayüz hiç görünmez.
    if (!wantsAllergens && !wantsDiet) return null

    // Veri hiç yok → sessizce "temiz" görünmesine izin verme.
    if (unavailable) {
        return (
            <div className={className}>
                <Notice tone="neutral">
                    Alerjen bilgisi şu an yüklenemedi. Bu,{" "}
                    <strong>alerjen yok anlamına gelmez</strong>.
                </Notice>
            </div>
        )
    }

    // Yemekhane bu yemek için reçete yayınlamamış.
    if (!hasIngredients) {
        return (
            <div className={className}>
                <Notice tone="neutral">
                    Bu yemek için malzeme listesi yayınlanmamış, bu yüzden alerjen
                    analizi yapılamıyor.
                </Notice>
            </div>
        )
    }

    const matched = filterHitsForUser(allergens, userAllergens, includeProbable)
    const matchedIds = new Set(matched.map((hit) => hit.id))
    const others = allergens.filter((hit) => !matchedIds.has(hit.id))
    const conflict = dietConflict(dietFlags, dietPreference)

    // Bloklar arası boşluk, blok İÇİ boşluğun en az 2 katı olmalı; yoksa
    // gruplama okunmaz (space-y-4 = 16px, iç ritim 6–12px).
    return (
        <div className={cn("space-y-4", className)}>
            {conflict && (
                <div className="flex gap-2 rounded-md border border-orange-500/50 bg-orange-500/10 p-2.5">
                    <Beef
                        className="size-4 shrink-0 text-orange-600 dark:text-orange-400"
                        strokeWidth={1.5}
                        aria-hidden="true"
                    />
                    <p className="text-xs text-orange-800 dark:text-orange-300 text-pretty">
                        <strong>{DIET_CONFLICT_LABELS[conflict]}.</strong> Beslenme
                        tercihinizle uyuşmuyor. Reçetede görünmeyen hayvansal içerik
                        (jelatin, bulyon vb.) ayrıca tespit edilemez.
                    </p>
                </div>
            )}

            {!wantsAllergens ? null : matched.length > 0 ? (
                // Diğer alerjenler kutusuyla aynı kalıp; durumu kenarlık ve
                // başlık rengi taşır. Zemin tinti yok: kırmızı rozet aynı tintli
                // zemine oturursa rozet sınırı kaybolur.
                <div className="rounded-lg border border-red-500/50 p-3">
                    <h4 className="mb-2 text-xs font-medium text-red-700 dark:text-red-400">
                        Seçtiğiniz alerjenlerden bu yemekte var
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                        {matched.map((hit) => (
                            <AllergenBadge key={hit.id} hit={hit} />
                        ))}
                    </div>
                </div>
            ) : (
                <Notice tone="neutral">
                    Yayınlanan reçetede seçtiğiniz alerjenler geçmiyor. Bu bir güvenlik
                    güvencesi değildir; aşağıdaki notu okuyun.
                </Notice>
            )}

            {wantsAllergens && others.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                        Yemekte tespit edilen diğer alerjenler
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                        {others.map((hit) => (
                            <AllergenBadge key={hit.id} hit={hit} muted />
                        ))}
                    </div>
                </div>
            )}

            {unmapped.length > 0 && (
                <Notice tone="amber">
                    Bu yemeğin bazı malzemeleri sınıflandırılamadı (
                    {unmapped.map((name) => toTitleCase(name)).join(", ")}). Alerjen
                    listesi <strong>eksik olabilir</strong>.
                </Notice>
            )}
        </div>
    )
}

interface MealAllergenMarkProps {
    allergens?: AllergenHit[]
    unmapped?: string[]
    userAllergens: readonly AllergenId[]
    includeProbable: boolean
    dietFlags?: DietFlags
    dietPreference: DietPreference
}

export function MealAllergenMark({
    allergens,
    unmapped,
    userAllergens,
    includeProbable,
    dietFlags,
    dietPreference,
}: MealAllergenMarkProps) {
    const wantsAllergens = userAllergens.length > 0
    const conflict = dietConflict(dietFlags, dietPreference)

    if (!wantsAllergens && !conflict) return null

    const matched = wantsAllergens
        ? filterHitsForUser(allergens ?? [], userAllergens, includeProbable)
        : []

    // Öncelik: kesin alerjen > içerebilir > beslenme > sınıflandırılamadı
    let Icon: typeof AlertTriangle
    let tone: string
    let label: string

    if (matched.length > 0) {
        const kesin = matched.some((hit) => hit.confidence === "kesin")
        const names = matched
            .map((h) => `${ALLERGEN_LABELS[h.id]} (${CONFIDENCE_LABELS[h.confidence]})`)
            .join(", ")
        Icon = kesin ? AlertTriangle : AlertCircle
        tone = kesin
            ? "text-red-600 dark:text-red-400"
            : "text-amber-600 dark:text-amber-400"
        label = `Alerjen uyarısı: ${names}`
    } else if (conflict) {
        Icon = Beef
        tone = "text-orange-600 dark:text-orange-400"
        label = DIET_CONFLICT_LABELS[conflict]
    } else if (wantsAllergens && (unmapped?.length ?? 0) > 0) {
        // Sınıflandırılamayan malzeme varsa yemek "temiz" gibi geçiştirilmez.
        Icon = HelpCircle
        tone = "text-muted-foreground"
        label = "Bazı malzemeleri sınıflandırılamadı"
    } else {
        return null
    }

    return (
        <span className="inline-flex shrink-0" role="img" aria-label={label}>
            <Icon className={cn("size-3.5", tone)} strokeWidth={1.5} aria-hidden="true" />
        </span>
    )
}

export function AllergenDisclaimer({ className }: { className?: string }) {
    return (
        <p
            className={cn(
                "max-w-prose text-xs leading-relaxed text-pretty text-muted-foreground",
                className
            )}
        >
        Bu bilgi yemekhanenin yayınladığı reçeteden otomatik olarak
        türetilmiştir; resmî bir gıda etiketi değildir.
        Hazır ürünlerin içeriği ve mutfaktaki çapraz bulaşma bu listeye dahil
        değildir. Ciddi bir gıda alerjiniz varsa yemeği tüketmeden önce mutlaka
        yemekhane yetkililerine danışın. Kaynak:{" "}
            <a
                href="https://yemekhane.cu.edu.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
            >
                yemekhane.cu.edu.tr
            </a>
        </p>
    )
}
