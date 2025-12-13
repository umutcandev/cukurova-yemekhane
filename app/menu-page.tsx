"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { UtensilsIcon, MoreVertical, ChevronRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

import { MealDetailModal } from "@/components/meal-detail-modal"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import type { DateRange } from "react-day-picker"
import type { MenuData } from "@/lib/types"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function ChatGptIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
        >
            <path d="M20.5624 10.1875C20.8124 9.5 20.8749 8.8125 20.8124 8.125C20.7499 7.4375 20.4999 6.75 20.1874 6.125C19.6249 5.1875 18.8124 4.4375 17.8749 4C16.8749 3.5625 15.8124 3.4375 14.7499 3.6875C14.2499 3.1875 13.6874 2.75 13.0624 2.4375C12.4374 2.125 11.6874 2 10.9999 2C9.9374 2 8.8749 2.3125 7.9999 2.9375C7.1249 3.5625 6.4999 4.4375 6.1874 5.4375C5.4374 5.625 4.8124 5.9375 4.1874 6.3125C3.6249 6.75 3.1874 7.3125 2.8124 7.875C2.24991 8.8125 2.06241 9.875 2.18741 10.9375C2.31241 12 2.7499 13 3.4374 13.8125C3.1874 14.5 3.1249 15.1875 3.1874 15.875C3.2499 16.5625 3.4999 17.25 3.8124 17.875C4.3749 18.8125 5.1874 19.5625 6.1249 20C7.1249 20.4375 8.1874 20.5625 9.2499 20.3125C9.7499 20.8125 10.3124 21.25 10.9374 21.5625C11.5624 21.875 12.3124 22 12.9999 22C14.0624 22 15.1249 21.6875 15.9999 21.0625C16.8749 20.4375 17.4999 19.5625 17.8124 18.5625C18.4999 18.4375 19.1874 18.125 19.7499 17.6875C20.3124 17.25 20.8124 16.75 21.1249 16.125C21.6874 15.1875 21.8749 14.125 21.7499 13.0625C21.6249 12 21.2499 11 20.5624 10.1875ZM13.0624 20.6875C12.0624 20.6875 11.3124 20.375 10.6249 19.8125C10.6249 19.8125 10.6874 19.75 10.7499 19.75L14.7499 17.4375C14.8749 17.375 14.9374 17.3125 14.9999 17.1875C15.0624 17.0625 15.0624 17 15.0624 16.875V11.25L16.7499 12.25V16.875C16.8124 19.0625 15.0624 20.6875 13.0624 20.6875ZM4.9999 17.25C4.5624 16.5 4.3749 15.625 4.5624 14.75C4.5624 14.75 4.6249 14.8125 4.6874 14.8125L8.6874 17.125C8.8124 17.1875 8.8749 17.1875 8.9999 17.1875C9.1249 17.1875 9.2499 17.1875 9.3124 17.125L14.1874 14.3125V16.25L10.1249 18.625C9.2499 19.125 8.2499 19.25 7.3124 19C6.3124 18.75 5.4999 18.125 4.9999 17.25ZM3.9374 8.5625C4.3749 7.8125 5.0624 7.25 5.8749 6.9375V7.0625V11.6875C5.8749 11.8125 5.8749 11.9375 5.9374 12C5.9999 12.125 6.0624 12.1875 6.1874 12.25L11.0624 15.0625L9.3749 16.0625L5.3749 13.75C4.4999 13.25 3.8749 12.4375 3.6249 11.5C3.3749 10.5625 3.4374 9.4375 3.9374 8.5625ZM17.7499 11.75L12.8749 8.9375L14.5624 7.9375L18.5624 10.25C19.1874 10.625 19.6874 11.125 19.9999 11.75C20.3124 12.375 20.4999 13.0625 20.4374 13.8125C20.3749 14.5 20.1249 15.1875 19.6874 15.75C19.2499 16.3125 18.6874 16.75 17.9999 17V12.25C17.9999 12.125 17.9999 12 17.9374 11.9375C17.9374 11.9375 17.8749 11.8125 17.7499 11.75ZM19.4374 9.25C19.4374 9.25 19.3749 9.1875 19.3124 9.1875L15.3124 6.875C15.1874 6.8125 15.1249 6.8125 14.9999 6.8125C14.8749 6.8125 14.7499 6.8125 14.6874 6.875L9.8124 9.6875V7.75L13.8749 5.375C14.4999 5 15.1874 4.875 15.9374 4.875C16.6249 4.875 17.3124 5.125 17.9374 5.5625C18.4999 6 18.9999 6.5625 19.2499 7.1875C19.4999 7.8125 19.5624 8.5625 19.4374 9.25ZM8.9374 12.75L7.2499 11.75V7.0625C7.2499 6.375 7.4374 5.625 7.8124 5.0625C8.1874 4.4375 8.7499 4 9.3749 3.6875C9.9999 3.375 10.7499 3.25 11.4374 3.375C12.1249 3.4375 12.8124 3.75 13.3749 4.1875C13.3749 4.1875 13.3124 4.25 13.2499 4.25L9.2499 6.5625C9.1249 6.625 9.0624 6.6875 8.9999 6.8125C8.9374 6.9375 8.9374 7 8.9374 7.125V12.75ZM9.8124 10.75L11.9999 9.5L14.1874 10.75V13.25L11.9999 14.5L9.8124 13.25V10.75Z" />
        </svg>
    )
}



// Rewriting icons to be more distinct even if not 1:1 original curve due to length.
// Used simplified widely recognized icons where possible.


function MagicIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M17.0007 1.20825 18.3195 3.68108 20.7923 4.99992 18.3195 6.31876 17.0007 8.79159 15.6818 6.31876 13.209 4.99992 15.6818 3.68108 17.0007 1.20825ZM8.00065 4.33325 10.6673 9.33325 15.6673 11.9999 10.6673 14.6666 8.00065 19.6666 5.33398 14.6666.333984 11.9999 5.33398 9.33325 8.00065 4.33325ZM19.6673 16.3333 18.0007 13.2083 16.334 16.3333 13.209 17.9999 16.334 19.6666 18.0007 22.7916 19.6673 19.6666 22.7923 17.9999 19.6673 16.3333Z"></path>
        </svg>
    )
}

function ClaudeBrandIcon({ className }: { className?: string }) {
    // Anthropic Claude Logo (User provided)
    return (
        <svg viewBox="0 0 1200 1200" className={className} fill="currentColor">
            <path d="M 233.959793 800.214905 L 468.644287 668.536987 L 472.590637 657.100647 L 468.644287 650.738403 L 457.208069 650.738403 L 417.986633 648.322144 L 283.892639 644.69812 L 167.597321 639.865845 L 54.926208 633.825623 L 26.577238 627.785339 L 3.3e-05 592.751709 L 2.73832 575.27533 L 26.577238 559.248352 L 60.724873 562.228149 L 136.187973 567.382629 L 249.422867 575.194763 L 331.570496 580.026978 L 453.261841 592.671082 L 472.590637 592.671082 L 475.328857 584.859009 L 468.724915 580.026978 L 463.570557 575.194763 L 346.389313 495.785217 L 219.543671 411.865906 L 153.100723 363.543762 L 117.181267 339.060425 L 99.060455 316.107361 L 91.248367 266.01355 L 123.865784 230.093994 L 167.677887 233.073853 L 178.872513 236.053772 L 223.248367 270.201477 L 318.040283 343.570496 L 441.825592 434.738342 L 459.946411 449.798706 L 467.194672 444.64447 L 468.080597 441.020203 L 459.946411 427.409485 L 392.617493 305.718323 L 320.778564 181.932983 L 288.80542 130.630859 L 280.348999 99.865845 C 277.369171 87.221436 275.194641 76.590698 275.194641 63.624268 L 312.322174 13.20813 L 332.8591 6.604126 L 382.389313 13.20813 L 403.248352 31.328979 L 434.013519 101.71814 L 483.865753 212.537048 L 561.181274 363.221497 L 583.812134 407.919434 L 595.892639 449.315491 L 600.40271 461.959839 L 608.214783 461.959839 L 608.214783 454.711609 L 614.577271 369.825623 L 626.335632 265.61084 L 637.771851 131.516846 L 641.718201 93.745117 L 660.402832 48.483276 L 697.530334 24.000122 L 726.52356 37.852417 L 750.362549 72 L 747.060486 94.067139 L 732.886047 186.201416 L 705.100708 330.52356 L 686.979919 427.167847 L 697.530334 427.167847 L 709.61084 415.087341 L 758.496704 350.174561 L 840.644348 247.490051 L 876.885925 206.738342 L 919.167847 161.71814 L 946.308838 140.29541 L 997.61084 140.29541 L 1035.38269 196.429626 L 1018.469849 254.416199 L 965.637634 321.422852 L 921.825562 378.201538 L 859.006714 462.765259 L 819.785278 530.41626 L 823.409424 535.812073 L 832.75177 534.92627 L 974.657776 504.724915 L 1051.328979 490.872559 L 1142.818848 475.167786 L 1184.214844 494.496582 L 1188.724854 514.147705 L 1172.456421 554.335693 L 1074.604126 578.496765 L 959.838989 601.449829 L 788.939636 641.879272 L 786.845764 643.409485 L 789.261841 646.389343 L 866.255127 653.637634 L 899.194702 655.409424 L 979.812134 655.409424 L 1129.932861 666.604187 L 1169.154419 692.537109 L 1192.671265 724.268677 L 1188.724854 748.429688 L 1128.322144 779.194641 L 1046.818848 759.865845 L 856.590759 714.604126 L 791.355774 698.335754 L 782.335693 698.335754 L 782.335693 703.731567 L 836.69812 756.885986 L 936.322205 846.845581 L 1061.073975 962.81897 L 1067.436279 991.490112 L 1051.409424 1014.120911 L 1034.496704 1011.704712 L 924.885986 929.234924 L 882.604126 892.107544 L 786.845764 811.48999 L 780.483276 811.48999 L 780.483276 819.946289 L 802.550415 852.241699 L 919.087341 1027.409424 L 925.127625 1081.127686 L 916.671204 1098.604126 L 886.469849 1109.154419 L 853.288696 1103.114136 L 785.073914 1007.355835 L 714.684631 899.516785 L 657.906067 802.872498 L 650.979858 806.81897 L 617.476624 1167.704834 L 601.771851 1186.147705 L 565.530212 1200 L 535.328857 1177.046997 L 519.302124 1139.919556 L 535.328857 1066.550537 L 554.657776 970.792053 L 570.362488 894.68457 L 584.536926 800.134277 L 592.993347 768.724976 L 592.429626 766.630859 L 585.503479 767.516968 L 514.22821 865.369263 L 405.825531 1011.865906 L 320.053711 1103.677979 L 299.516815 1111.812256 L 263.919525 1093.369263 L 267.221497 1060.429688 L 287.114136 1031.114136 L 405.825531 880.107361 L 477.422913 786.52356 L 523.651062 732.483276 L 523.328918 724.671265 L 520.590698 724.671265 L 205.288605 929.395935 L 149.154434 936.644409 L 124.993355 914.01355 L 127.973183 876.885986 L 139.409409 864.80542 L 234.201385 799.570435 L 233.879227 799.8927 Z" />
        </svg>
    )
}

function GrokIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 512 492" fill="currentColor" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M197.76 315.52l170.197-125.803c8.342-6.186 20.267-3.776 24.256 5.803 20.907 50.539 11.563 111.253-30.08 152.939-41.621 41.685-99.562 50.816-152.512 29.994l-57.834 26.816c82.965 56.768 183.701 42.731 246.656-20.33 49.941-50.006 65.408-118.166 50.944-179.627l.128.149c-20.971-90.282 5.162-126.378 58.666-200.17 1.28-1.75 2.56-3.499 3.819-5.291l-70.421 70.507v-.214l-243.883 245.27m-35.072 30.528c-59.563-56.96-49.28-145.088 1.515-195.926 37.568-37.61 99.136-52.97 152.874-30.4l57.707-26.666a166.554 166.554 0 00-39.019-21.334 191.467 191.467 0 00-208.042 41.942c-54.038 54.101-71.04 137.301-41.856 208.298 21.802 53.056-13.931 90.582-49.92 128.47C23.104 463.915 10.304 477.333 0 491.541l162.56-145.386" />
        </svg>
    )
}

function PerplexityIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z" />
        </svg>
    )
}


function formatDate(dateString: string) {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        weekday: "long",
    }
    return date.toLocaleDateString("tr-TR", options)
}

function formatDayName(dateString: string) {
    const date = new Date(dateString)
    const dayName = date.toLocaleDateString("tr-TR", { weekday: "long" })
    return dayName.charAt(0).toUpperCase() + dayName.slice(1) + " Menüsü"
}


function formatDateShort(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    })
}


function getCalorieBadgeClasses(calories: number): string {
    const baseClasses = "font-mono border"
    if (calories < 800) {
        // Yeşil - düşük kalori
        return `${baseClasses} border-green-500 text-green-700 dark:text-green-400 bg-green-500/10`
    }
    if (calories < 1100) {
        // Turuncu - orta kalori
        return `${baseClasses} border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-500/10`
    }
    // Kırmızı - yüksek kalori
    return `${baseClasses} border-red-500 text-red-700 dark:text-red-400 bg-red-500/10`
}

// AI Helper Functions
function generateAiPrompt(menuDay: any) {
    const jsonStr = JSON.stringify(menuDay, null, 2);
    return `Çukurova Üniversitesi yemekhanesi menüsünü en iyi bilen yapay zeka sensin. Aşağıdaki menüyü incele ve şu üç farklı karakter gibi yorumla:

1. **Şüpheci Diyetisyen:** Menüdeki "gizli tehlikeleri" veya "sağlıklı yanları" esprili bir dille anlat.
2. **Gym Rat (Sporcu):** "Bu menü basmak için yeterli mi?" sorusuna odaklan. Protein durumunu sorgula.
3. **Vize Haftasındaki Öğrenci:** Sadece şuna odaklan: Bu yemek beni mutlu eder mi, doyurur mu ve uyku bastırır mı?

İşte Menü Verisi:
${jsonStr}`;
}

function getAiLinks(prompt: string) {
    const encodedPrompt = encodeURIComponent(prompt);
    return {
        chatgpt: `https://chat.openai.com/?q=${encodedPrompt}`,
        claude: `https://claude.ai/new?q=${encodedPrompt}`,
        grok: `https://x.com/i/grok?text=${encodedPrompt}`,
        perplexity: `https://www.perplexity.ai/search/new?q=${encodedPrompt}`
    };
}


export default function MenuPage({ menuData }: { menuData: MenuData }) {

    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined)
    const [selectedMeal, setSelectedMeal] = useState<{ id: string; name: string; calories: number } | null>(null)

    // Find today's date or nearest available date for mobile initial view
    const findInitialDateIndex = (): number => {
        const today = new Date().toISOString().split("T")[0]

        // Try to find today's menu
        const todayIndex = menuData.days.findIndex((day) => day.date === today)
        if (todayIndex !== -1) return todayIndex

        // If today not found, find nearest future date
        const futureIndex = menuData.days.findIndex((day) => day.date > today)
        if (futureIndex !== -1) return futureIndex

        // If no future dates, use the last available date
        return menuData.days.length - 1
    }

    const [mobileSelectedDateIndex, setMobileSelectedDateIndex] = useState<number>(findInitialDateIndex())
    const today = new Date().toISOString().split("T")[0]

    const todayMenu = menuData.days.find((day) => day.date === today)

    // Create dates in local timezone to avoid off-by-one errors
    const availableDates = menuData.days.map((day) => {
        const [year, month, dayNum] = day.date.split("-").map(Number)
        return new Date(year, month - 1, dayNum)
    })

    const selectedDateMenus = selectedDateRange?.from
        ? menuData.days.filter((day) => {
            const dayDateStr = day.date // Already in ISO format: "2025-11-03"
            // Convert Date to local date string (YYYY-MM-DD) without timezone conversion
            const fromDate = selectedDateRange.from!
            const fromStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`
            const toDate = selectedDateRange.to || selectedDateRange.from!
            const toStr = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`
            return dayDateStr >= fromStr && dayDateStr <= toStr
        })
        : []

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setSelectedDateRange(range)
    }

    const handleCancel = () => {
        setSelectedDateRange(undefined)
    }

    const handleMealClick = (mealId: string, mealName: string, mealCalories: number) => {
        setSelectedMeal({ id: mealId, name: mealName, calories: mealCalories })
    }

    const handleModalClose = () => {
        setSelectedMeal(null)
    }

    // Mobile navigation handlers
    const handleMobileDateRangeSelect = (range: DateRange | undefined) => {
        if (range?.from) {
            // Find the index of the selected date
            const index = availableDates.findIndex(
                (d) => d.toISOString().split("T")[0] === range.from!.toISOString().split("T")[0]
            )
            if (index !== -1) {
                setMobileSelectedDateIndex(index)
            }
            // Also update the selected date range for potential display
            setSelectedDateRange(range)
        }
    }

    const handleMobilePrevious = () => {
        if (mobileSelectedDateIndex > 0) {
            setMobileSelectedDateIndex(mobileSelectedDateIndex - 1)
        }
    }

    const handleMobileNext = () => {
        if (mobileSelectedDateIndex < availableDates.length - 1) {
            setMobileSelectedDateIndex(mobileSelectedDateIndex + 1)
        }
    }

    const mobileCurrentDate = availableDates[mobileSelectedDateIndex]
    const mobileCurrentMenu = menuData.days[mobileSelectedDateIndex]

    return (
        <main className="min-h-screen bg-background pb-20 md:pb-8">
            {/* Header */}
            <header className="dark text-foreground sticky top-0 z-50 border-b border-border bg-background">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="relative h-9 w-40 md:w-48">
                            <Image
                                src="/logo-cu.png"
                                alt="ÇÜ Yemekhane"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 border border-border/40" asChild>
                                <Link href="https://github.com/umutcandev/cukurova-yemekhane" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                        <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z" />
                                    </svg>
                                    <span className="sr-only">Proje Github Sayfası</span>
                                </Link>
                            </Button>
                            <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 md:py-8">


                {/* Mobile Menu View - Shows selected date(s) from mobile navigation */}
                <section className="max-w-md mx-auto">
                    {selectedDateRange?.from && selectedDateMenus.length > 0 ? (
                        // Show range of menus if date range is selected
                        <div className="grid gap-4">
                            {selectedDateMenus.map((day) => (
                                <Card key={day.ymk} className="border border-border/40 bg-card overflow-hidden shadow-sm">
                                    <div className="bg-muted/20 px-3 py-2 border-b border-border/40">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="text-lg font-semibold text-foreground tracking-tight">{formatDayName(day.date)}</div>
                                                <Badge className={`${getCalorieBadgeClasses(day.totalCalories)} text-[10px] px-1.5 py-0 h-5 font-mono`}>
                                                    {day.totalCalories} kcal
                                                </Badge>
                                            </div>
                                            <Badge variant="outline" className="text-xs font-mono font-normal">
                                                {formatDateShort(day.date)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground/60 leading-none">
                                            Menüler yemekhane sitesinden alınmaktadır.
                                        </p>
                                    </div>

                                    <div className="px-3">
                                        <div className="space-y-0">
                                            {day.meals.map((meal, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-t border-border/40 first:border-t-0"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <UtensilsIcon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                                                        <span
                                                            className="font-medium text-sm text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                                                            onClick={() => handleMealClick(meal.id, meal.name, meal.calories)}
                                                        >
                                                            {meal.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 pl-2">
                                                        <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-2 text-muted-foreground bg-secondary/50 hover:bg-secondary/70">
                                                            {meal.calories} kcal
                                                        </Badge>
                                                        <button
                                                            onClick={() => handleMealClick(meal.id, meal.name, meal.calories)}
                                                            className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground/70 hover:text-foreground"
                                                            aria-label="Detayları göster"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-border/40 bg-muted/20 px-3 py-2 flex items-center justify-between">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="relative overflow-hidden h-7 text-xs border-0 bg-transparent hover:bg-transparent transition-none group/ai-btn p-[1px]">
                                                    <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#A8C6FA_0%,#B388EB_25%,#FCAFBB_50%,#B388EB_75%,#A8C6FA_100%)] opacity-60" />
                                                    <span className="relative h-full w-full bg-background/95 group-hover/ai-btn:bg-background/100 transition-colors rounded-[calc(var(--radius)-3px)] flex items-center justify-center gap-1.5 px-2.5">
                                                        <MagicIcon className="w-3.5 h-3.5 text-primary/80" />
                                                        <span className="bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent font-medium">Yapay Zekâya Sor</span>
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-44 p-2">
                                                {(() => {
                                                    const prompt = generateAiPrompt(day);
                                                    const links = getAiLinks(prompt);
                                                    return (
                                                        <>
                                                            <DropdownMenuItem asChild>
                                                                <a href={links.chatgpt} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer gap-2 py-2.5 px-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors mb-1.5 group">
                                                                    <ChatGptIcon className="h-3.5 w-3.5 text-foreground/80" />
                                                                    <span className="font-semibold text-xs">ChatGPT</span><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <a href={links.claude} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer gap-2 py-2.5 px-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors mb-1.5 group">
                                                                    <ClaudeBrandIcon className="h-3.5 w-3.5 text-foreground/80" />
                                                                    <span className="font-semibold text-xs">Claude</span><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <a href={links.grok} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer gap-2 py-2.5 px-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors mb-1.5 group">
                                                                    <GrokIcon className="h-3.5 w-3.5 text-foreground/80" />
                                                                    <span className="font-semibold text-xs">Grok</span><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <a href={links.perplexity} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer gap-2 py-2.5 px-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors mb-1.5 group">
                                                                    <PerplexityIcon className="h-3.5 w-3.5 text-foreground/80" />
                                                                    <span className="font-semibold text-xs">Perplexity</span><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                                                </a>
                                                            </DropdownMenuItem>
                                                        </>
                                                    );
                                                })()}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <span className="text-[10px] text-muted-foreground/60 font-medium">Menü Asistanı (AI) hata yapabilir.</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : mobileCurrentMenu ? (
                        // Show single menu from arrow navigation
                        <div className="max-w-md mx-auto">
                            <Card className="border border-border/40 bg-card overflow-hidden shadow-sm">
                                <div className="bg-muted/20 px-3 py-3 border-b border-border/40">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="text-lg font-semibold text-foreground tracking-tight">{formatDayName(mobileCurrentMenu.date)}</div>
                                            <Badge className={`${getCalorieBadgeClasses(mobileCurrentMenu.totalCalories)} text-[10px] px-1.5 py-0 h-5 font-mono`}>
                                                {mobileCurrentMenu.totalCalories} kcal
                                            </Badge>
                                        </div>
                                        <Badge variant="outline" className="text-xs font-mono font-normal">
                                            {formatDateShort(mobileCurrentMenu.date)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground/60 leading-none">
                                        Menüler yemekhane sitesinden alınmaktadır.
                                    </p>
                                </div>

                                <div className="px-3">
                                    <div className="space-y-0">
                                        {mobileCurrentMenu.meals.map((meal, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-t border-border/40 first:border-t-0"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <UtensilsIcon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                                                    <span
                                                        className="font-medium text-sm text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                                                        onClick={() => handleMealClick(meal.id, meal.name, meal.calories)}
                                                    >
                                                        {meal.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 pl-2">
                                                    <Badge variant="secondary" className="font-mono font-normal text-[10px] h-5 px-2 text-muted-foreground bg-secondary/50 hover:bg-secondary/70">
                                                        {meal.calories} kcal
                                                    </Badge>
                                                    <button
                                                        onClick={() => handleMealClick(meal.id, meal.name, meal.calories)}
                                                        className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground/70 hover:text-foreground"
                                                        aria-label="Detayları göster"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-border/40 bg-muted/20 px-3 py-2 flex items-center justify-between">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="relative overflow-hidden h-7 text-xs border-0 bg-transparent hover:bg-transparent transition-none group/ai-btn p-[1px]">
                                                <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#A8C6FA_0%,#B388EB_25%,#FCAFBB_50%,#B388EB_75%,#A8C6FA_100%)] opacity-60" />
                                                <span className="relative h-full w-full bg-background/95 group-hover/ai-btn:bg-background/100 transition-colors rounded-[calc(var(--radius)-3px)] flex items-center justify-center gap-1.5 px-2.5">
                                                    <MagicIcon className="w-3.5 h-3.5 text-primary/80" />
                                                    <span className="bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent font-medium">Yapay Zekâya Sor</span>
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-44 p-2">
                                            {(() => {
                                                const prompt = generateAiPrompt(mobileCurrentMenu);
                                                const links = getAiLinks(prompt);
                                                return (
                                                    <>
                                                        <DropdownMenuItem asChild>
                                                            <a href={links.chatgpt} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer gap-2 py-2.5 px-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors mb-1.5 group">
                                                                <ChatGptIcon className="h-3.5 w-3.5 text-foreground/80" />
                                                                <span className="font-semibold text-xs">ChatGPT</span><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                                            </a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <a href={links.claude} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer gap-2 py-2.5 px-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors mb-1.5 group">
                                                                <ClaudeBrandIcon className="h-3.5 w-3.5 text-foreground/80" />
                                                                <span className="font-semibold text-xs">Claude</span><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                                            </a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <a href={links.grok} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer gap-2 py-2.5 px-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors mb-1.5 group">
                                                                <GrokIcon className="h-3.5 w-3.5 text-foreground/80" />
                                                                <span className="font-semibold text-xs">Grok</span><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                                            </a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <a href={links.perplexity} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer gap-2 py-2.5 px-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors mb-1.5 group">
                                                                <PerplexityIcon className="h-3.5 w-3.5 text-foreground/80" />
                                                                <span className="font-semibold text-xs">Perplexity</span><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                                            </a>
                                                        </DropdownMenuItem>
                                                    </>
                                                );
                                            })()}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <span className="text-[10px] text-muted-foreground/60 font-medium">Menü Asistanı (AI) hata yapabilir.</span>
                                </div>
                            </Card>
                        </div>
                    ) : null}
                </section>




            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav
                availableDates={availableDates}
                currentDate={mobileCurrentDate}
                onDateRangeSelect={handleMobileDateRangeSelect}
                onPrevious={handleMobilePrevious}
                onNext={handleMobileNext}
                canGoPrevious={mobileSelectedDateIndex > 0}
                canGoNext={mobileSelectedDateIndex < availableDates.length - 1}
                lastUpdated={menuData.lastUpdated}
                totalDays={menuData.totalDays}
            />

            {/* Meal Detail Modal */}
            {selectedMeal && (
                <MealDetailModal
                    mealId={selectedMeal.id}
                    mealName={selectedMeal.name}
                    mealCalories={selectedMeal.calories}
                    open={!!selectedMeal}
                    onOpenChange={handleModalClose}
                />
            )}
        </main>
    )
}
