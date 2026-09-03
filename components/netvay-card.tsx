import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function NetvayLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 594 120"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <path d="M191.55 20.35V32.37C196.74 23.08 206.17 19.26 215.59 19.12C233.62 19.12 246.05 30.18 246.05 48.9V87.83H239.36V49.03C239.36 33.73 229.94 25.54 215.32 25.67C201.39 25.81 191.69 36.33 191.69 50.26V87.82H185V20.35H191.55Z" />
            <path d="M253.69 54.09C253.69 33.88 268.99 19.26 287.97 19.26C306.96 19.26 323.89 30.87 321.3 57.23H260.52C261.89 73.07 274.04 82.23 287.97 82.23C296.85 82.23 307.23 78.68 312.28 71.99L317.06 75.81C310.5 84.42 298.76 88.79 287.97 88.79C268.99 88.78 253.69 75.53 253.69 54.09ZM315.29 51.35C315.15 34.69 304.23 25.4 287.97 25.4C274.04 25.4 262.02 34.82 260.52 51.35H315.29Z" />
            <path d="M345.19 0V20.35H368.14V25.95H345.19V67.06C345.19 76.21 347.1 82.63 357.62 82.63C360.9 82.63 364.59 81.54 368 79.9L370.32 85.36C366.09 87.41 361.85 88.78 357.62 88.78C343.28 88.78 338.63 80.31 338.63 67.06V25.95H324.29V20.35H338.63V0.68L345.19 0Z" />
            <path d="M445.17 20.35L416.62 88.1H401.19L372.51 20.35H388.08L397.1 42.07L408.98 73.35L419.63 44.8L429.74 20.35H445.17Z" />
            <path d="M593.76 20.48L551.28 119.1H535.71L549.64 86.87L522.73 20.48H539.12L550.73 52.31L557.42 71.43L564.66 52.58L578.04 20.48H593.76Z" />
            <path d="M502.53 20.48L502.11 31.14C497.89 23.49 488.73 18.99 479.17 18.99C459.77 18.99 444.34 31.56 444.34 54.08C444.34 77.04 459.22 89.74 478.9 89.61C487.23 89.61 497.6 85.5 502.1 76.89L502.78 87.83H516.18V20.48H502.53ZM497.12 56.39C497.12 59.51 494.59 62.01 491.5 62.01C488.4 62.01 485.88 59.51 485.88 56.39V54.06L467.16 72.76C464.98 74.96 461.4 74.96 459.23 72.76C457.03 70.56 457.03 67 459.23 64.81L477.86 46.18H475.66C472.54 46.18 470.04 43.65 470.04 40.56C470.04 37.46 472.54 34.94 475.66 34.94H490.51C490.75 34.94 490.97 34.98 491.19 35.01C492.68 34.97 494.2 35.49 495.34 36.66C496.37 37.67 496.92 38.99 496.99 40.33C497.08 40.73 497.12 41.14 497.12 41.56V56.39Z" />
            <path d="M62.6111 74.7094C62.6111 76.2014 62.5066 77.6993 62.2802 79.203C61.7751 82.6748 60.643 86.164 58.8316 89.5197L58.7736 89.6242H18.2149C4.44952 89.6242 -4.32872 74.9242 2.20271 62.8018L3.79347 59.8467C9.25084 49.7332 19.8114 43.4166 31.3125 43.4166C35.9803 43.4166 40.323 44.4035 44.1896 46.1569C55.3656 51.1788 62.6111 62.5522 62.6111 74.7094Z" />
            <path d="M105.266 44.4674L80.9165 89.6242H20.752L44.1838 46.1627L47.9459 39.1726C53.4033 29.059 63.9697 22.7424 75.4766 22.7424C81.0791 22.7424 86.2172 24.1706 90.6179 26.6206C97.637 30.5105 102.839 36.9955 105.266 44.4674Z" />
            <path d="M151.084 25.7266C147.206 24.3854 143.125 23.7236 138.904 23.7236C125.052 23.7236 112.36 31.3 105.777 43.5095L105.266 44.4674L80.9165 89.6242H56.6603L62.2744 79.203L90.6179 26.6206L93.8691 20.6001C99.3148 10.4692 109.875 4.16996 121.382 4.16996C135.85 4.16996 147.102 13.61 151.084 25.7266Z" />
            <path d="M115.623 81.0666V81.1189L112.407 84.3294L115.623 81.0666Z" />
            <path d="M170.22 61.3969C170.22 66.3201 169.018 71.3827 166.417 76.1956C164.182 80.3409 160.919 83.6966 157.029 86.0189C153.14 88.3412 148.634 89.63 143.943 89.63H126.491L143.252 60.9266L143.775 62.918C144.477 65.5828 147.195 67.1503 149.836 66.4652C152.489 65.7628 154.086 63.0573 153.383 60.3925L150.039 47.7128C149.952 47.3528 149.825 47.0103 149.656 46.691C149.296 45.5531 148.536 44.5603 147.421 43.9217C146.184 43.1843 144.768 43.0798 143.502 43.4514C143.311 43.4746 143.107 43.492 142.904 43.5559L130.224 46.8826C127.56 47.5851 125.992 50.3021 126.677 52.9437C127.38 55.597 130.085 57.1935 132.75 56.491L134.625 55.9917L114.996 89.63H88.1562L106.752 55.1267L111.385 46.54C116.842 36.4265 127.42 30.1099 138.898 30.1099C143.897 30.1099 148.518 31.2478 152.588 33.2334C163.317 38.4353 170.22 49.5474 170.22 61.3969Z" />
            {/* ".com" — wordmark'ın altına, ikinci kademeye yerleşiyor */}
            <path d="M451.65 117.87C451.65 119.61 449 119.61 449 117.87C449.01 116.13 451.65 116.13 451.65 117.87Z" />
            <path d="M468.77 116.67C467.1 118.34 464.92 119.15 462.74 119.15C458.08 119.15 454.23 115.83 454.23 110.61C454.23 105.38 457.95 102.07 462.74 102.07C464.92 102.07 467.09 102.91 468.77 104.55L467.73 105.59C466.39 104.25 464.51 103.61 462.74 103.61C458.99 103.61 455.84 106.15 455.84 110.61C455.84 115.06 458.99 117.61 462.74 117.61C464.51 117.61 466.32 116.91 467.66 115.57L468.77 116.67Z" />
            <path d="M469.81 110.67C469.81 105.41 473.56 102.06 478.22 102.06C482.88 102.06 486.63 105.41 486.63 110.67C486.63 115.93 482.88 119.14 478.22 119.14C473.56 119.15 469.81 115.93 469.81 110.67ZM485.01 110.67C485.01 106.38 481.96 103.6 478.21 103.6C474.46 103.6 471.41 106.38 471.41 110.67C471.41 114.96 474.46 117.54 478.21 117.54C481.96 117.54 485.01 114.96 485.01 110.67Z" />
            <path d="M513.98 118.88V108.97C513.98 105.79 511.84 103.54 508.69 103.54C505.54 103.54 503.36 105.88 503.36 109.07V118.88H501.72V109.07C501.72 105.89 499.54 103.58 496.39 103.58C493.24 103.58 491.1 105.89 491.1 109.07V118.88H489.46V102.33H491L491.03 105.08C492.17 102.9 494.28 102 496.42 102C498.93 102 501.58 103.14 502.55 106.09C503.55 103.38 506.13 102 508.68 102C512.73 102 515.61 104.85 515.61 108.97V118.88H513.98Z" />
        </svg>
    )
}

/**
 * Menü kartının altındaki sponsor kartı. Yüzey menü kartıyla aynı
 * (bg-card + ring-1 ring-foreground/10), yatay dolgu da kartın header/footer
 * satırlarıyla aynı px-3 — böylece iki kartın içerik kenarları hizalı duruyor.
 * Yarıçap ise sayfanın tepesindeki bilgilendirme banner'ıyla aynı: rounded-lg.
 * Logo cümlenin içinde metin boyutunda akıyor.
 */
export function NetvayCard({ className }: { className?: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    href="https://www.netvay.com"
                    target="_blank"
                    rel="sponsored noopener"
                    className={cn(
                        // hover zemini opak olmalı: yarı saydam bir değer (bg-muted/30
                        // gibi) kartın kendi zeminini kaldırıp altındaki sayfayı
                        // gösteriyor, geçiş boyunca alfa rampası yarı saydam ring'in
                        // arkasını da oynattığı için kenarda titreme olarak okunuyor.
                        "flex items-center justify-center gap-1.5 rounded-lg bg-card px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted",
                        className,
                    )}
                >
                    {/* Cümle logonun iki yanına neredeyse eşit bölünüyor
                        ("Sunucu altyapısı" ~99px / "sponsorluğunda." ~93px), böylece
                        logo tek satırda kalırken görsel olarak da ortaya oturuyor. */}
                    <span>Sunucu altyapısı</span>
                    {/* Logo marka adının yerine geçiyor; erişilebilir ve taranabilir
                        karşılığını yanındaki sr-only metin veriyor. */}
                    {/* h-4 = 16px, yani text-xs'in satır kutusuyla birebir aynı.
                        Satır yüksekliğini metin belirlediği için logo bu değere
                        kadar büyüyebiliyor ve kart 36px'te sabit kalıyor; 16px'i
                        aşan her değer kartı da uzatır. */}
                    <NetvayLogo className="h-4 w-auto shrink-0 text-foreground" />
                    <span className="sr-only">NetVay Bilişim Hizmetleri</span>
                    <span>ile sağlanmaktadır.</span>
                </a>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-[14rem] text-center">
                Bu site, NetVay Bilişim Hizmetleri sponsorluğunda sağlanan sunucu altyapısı üzerinde çalışmaktadır. NetVay, Türkiye'de yüksek performanslı ve güvenilir bilişim hizmetleri sunan bir şirkettir.
            </TooltipContent>
        </Tooltip>
    )
}
