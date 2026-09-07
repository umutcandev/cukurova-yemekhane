"use client"

import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAllergenNudge } from "@/hooks/use-allergen-nudge"
import { cn } from "@/lib/utils"

/** Ayarlar sayfasında alerjen bölümünü açıp vurgulayan hedef. */
export const ALLERGEN_SETTINGS_HREF = "/ayarlar?vurgu=alerjen"

/**
 * Rozetin kcal'dan CTA'ya dönmesi için beklenen süre.
 *
 * Anında dönseydi sayfanın kendi görüntüsü sanılır, hiç fark edilmezdi.
 * Kullanıcı önce yemek adını ve kalorisini okusun; değişim ancak okuma
 * bittikten sonra, ama kullanıcı hâlâ ekrandayken gelmeli.
 */
export const NUDGE_MORPH_DELAY_MS = 4000

/**
 * CTA'nın ekranda kalma süresi. Sonunda rozet KALICI olarak kcal'a döner.
 *
 * Kalori, rozetin asıl işi; dürtme onu süresiz gasbedemez. Bir kez gösterip
 * çekilmek hem kaloriyi geri verir hem de dürtmenin ısrarcı olmasını önler.
 */
export const NUDGE_HOLD_MS = 6000

/**
 * Kalori sütununun genişliği. Menü tablosu `table-fixed`; sütun genişliği ilk
 * satırdan gelir ve 140px, "Alerjin mi var?" etiketini almıyor.
 *
 * Genişlik ANINDA değişir, CSS geçişi yoktur: rozetin kendisi framer'ın
 * layout animasyonuyla eski kutusundan yenisine kayıyor. İkisi birden
 * animasyonlu olsaydı framer, hâlâ hareket hâlindeki bir kutuyu ölçerdi.
 */
export const CALORIE_COLUMN_WIDTH = 140
export const CALORIE_COLUMN_WIDTH_NUDGE = 156

interface CalorieNudgeBadgeProps {
    calories: number
    /** Ekran okuyucu etiketinde hangi yemekten bahsettiğimizi söylemek için. */
    mealName: string
    /** true → rozet CTA'ya dönüşmüş durumda */
    active: boolean
    onClick: () => void
}

/**
 * Menü satırındaki kalori rozeti.
 *
 * Normalde eski rozetle birebir aynı görünür. `active` olduğunda primary'ye
 * dönüp "Alerjin mi var?" der ve yemek detayını açar — kullanıcı orada
 * alerjen tercihi CTA'sıyla karşılaşır.
 *
 * Rozet her durumda gerçek bir `button`: satırın kendisi tıklanabilir ama
 * odaklanılabilir değil, dolayısıyla klavye kullanıcısının yemek detayına
 * ulaşabildiği tek yer burası.
 */
export function CalorieNudgeBadge({
    calories,
    mealName,
    active,
    onClick,
}: CalorieNudgeBadgeProps) {
    const reduceMotion = useReducedMotion()
    const transition = reduceMotion
        ? { duration: 0 }
        : ({ type: "spring", duration: 0.3, bounce: 0 } as const)

    return (
        <motion.button
            type="button"
            // Hareketin tamamı tek sistemde: genişlik değişimini framer taşır.
            //
            // layoutDependency ŞART: `layout` tek başına her render'da düzeni
            // ölçer, yani rozetin kendisiyle ilgisi olmayan kaymaları da
            // (menü sayfasındaki bilgi bandı localStorage okunduktan sonra
            // açılıp kartı aşağı itiyor) animasyona çevirir — sayfa ilk
            // açılışta bütün rozetler yukarıdan aşağı süzülür. Ölçüm yalnızca
            // `active` değiştiğinde yapılsın.
            layout={!reduceMotion}
            layoutDependency={active}
            transition={transition}
            onClick={onClick}
            aria-label={
                active
                    ? `Alerjin mi var? ${mealName} detayını açıp alerjen tercihlerinizi ayarlayın. ${calories} kcal`
                    : `${calories} kcal — ${mealName} detayını aç`
            }
            className={cn(
                // `relative`: AnimatePresence popLayout, çıkan etiketi mutlak
                // konumlandırır — konumlanmış bir ata olmazsa "540 kcal"
                // sönerken kartın bambaşka bir köşesine sıçrar.
                "relative inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md px-2 text-[10px] font-normal whitespace-nowrap",
                // Renk geçişi kesilebilir olsun diye framer'da değil CSS'te.
                "transition-[background-color,color] duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
                "focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]",
                active
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
            )}
        >
            {/* initial={false}: ilk boyamada rozet olduğu yerde durur, açılış
                animasyonu yapmaz. Asıl geçiş 4 saniye sonra gelir. */}
            <AnimatePresence initial={false} mode="popLayout">
                {active ? (
                    <motion.span
                        key="cta"
                        layout={!reduceMotion}
                        layoutDependency={active}
                        // Primary zeminde 10px normal ağırlık inceliyor; CTA
                        // metni okunur kalsın diye tek adım kalın.
                        className="font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={transition}
                    >
                        Alerjin mi var?
                    </motion.span>
                ) : (
                    <motion.span
                        key="kcal"
                        layout={!reduceMotion}
                        layoutDependency={active}
                        className="font-mono"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={transition}
                    >
                        {calories} kcal
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    )
}

interface AllergenNudgeCardProps {
    /** Yönlendirmeden önce modalı kapat — Radix açık kalırsa sayfa kilitlenir. */
    onNavigate?: () => void
    className?: string
}

/**
 * Yemek detayındaki CTA katmanı.
 *
 * Alerjen şeridinin duracağı YERDE durur: kullanıcı tercihini yaptığında bu
 * kutunun yerine gerçek alerjen analizi geçer, yani kutu vaat ettiği şeyi
 * bulunduğu yerde gösteriyor.
 *
 * Oturumsuz kullanıcı Google girişine, oturumlu kullanıcı doğrudan hesap
 * ayarlarındaki alerjen bölümüne gider. Giriş sonrası dönüş adresi de aynı
 * bölüm: kullanıcı "alerjenlerimi seçeyim" diye başladığı işi giriş yaptıktan
 * sonra kaldığı yerden sürdürür.
 */
export function AllergenNudgeCard({ onNavigate, className }: AllergenNudgeCardProps) {
    const router = useRouter()
    const { status } = useSession()
    const { dismiss } = useAllergenNudge()

    const isAuthenticated = status === "authenticated"

    // Dikkat: burada dismiss() YOK. "Alerjenlerimi seç" bir evet; reddi
    // kaydetmek kullanıcının söylemediği bir şeyi söylemesi olurdu. Ayarlarda
    // gerçekten seçim yaparsa dürtme zaten kendiliğinden susar (showsWarnings).
    const handleSetup = () => {
        if (isAuthenticated) {
            onNavigate?.()
            router.push(ALLERGEN_SETTINGS_HREF)
            return
        }
        signIn("google", { callbackUrl: ALLERGEN_SETTINGS_HREF })
    }

    const handleDismiss = () => {
        dismiss()
        toast.success("Tamam, alerjen sormayacağız.", {
            description: "Fikrinizi değiştirirseniz Hesap Ayarları'ndan açabilirsiniz.",
            duration: 4000,
        })
    }

    return (
        <div className={cn("rounded-lg border border-border bg-muted/40 p-3", className)}>
            <p className="text-sm font-medium text-foreground">
                Alerjenler sizin için işaretlensin
            </p>
            {/* Kısa tut: bu kutu malzeme tablosunun önünde duruyor, kullanıcı
                buraya yemeğe bakmaya geldi. Ayrıntı ayarlar sayfasında. */}
            <p className="mt-1 text-xs leading-snug text-pretty text-muted-foreground">
                {isAuthenticated
                    ? "Alerjenlerinizi seçin, öğünlerinizde bulunduğunda uyaralım."
                    : "Giriş yapıp alerjenlerinizi seçin, öğünlerinizde bulunduğunda uyaralım."}
            </p>

            {/* Aksiyonlar metinden ayrı bir blok: satır içi bırakılınca
                açıklamanın devamı gibi okunuyordu. Blok arası boşluk (10px)
                blok içi boşluğun (2px) katı. */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Button
                    type="button"
                    size="sm"
                    className="h-7 gap-1 px-2.5 text-xs"
                    disabled={status === "loading"}
                    onClick={handleSetup}
                >
                    {isAuthenticated ? "Alerjenlerimi seç" : "Giriş yap ve seç"}
                    <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2.5 text-xs text-muted-foreground"
                    onClick={handleDismiss}
                >
                    Alerjim yok
                </Button>
            </div>
        </div>
    )
}
