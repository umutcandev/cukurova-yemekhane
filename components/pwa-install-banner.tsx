"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if user has already dismissed the banner
        const isDismissed = localStorage.getItem("pwa-install-banner-closed")
        if (isDismissed) return

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()

        const { outcome } = await deferredPrompt.userChoice
        if (outcome === "accepted") {
            setIsVisible(false)
        }
        setDeferredPrompt(null)
    }

    const handleCloseClick = () => {
        setIsVisible(false)
        localStorage.setItem("pwa-install-banner-closed", "true")
    }

    if (!isVisible) return null

    return (
        <div className="dark w-full bg-[#101010] border-b border-white/10 md:hidden">
            <div className="container mx-auto flex items-center justify-between gap-3 py-2.5 px-4">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleCloseClick}
                        className="text-white/50 hover:text-white transition-colors"
                        aria-label="Kapat"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1">
                        <Image
                            src="/icon/icon-512x512.png"
                            alt="App Icon"
                            width={32}
                            height={32}
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col justify-center min-w-0 self-center">
                        <span className="text-sm font-semibold text-white leading-tight">Yemekhane</span>
                        {/* Marquee for small screens */}
                        <div className="flex items-center overflow-hidden h-[12px] whitespace-nowrap max-w-[180px] xs:max-w-[240px] sm:hidden">
                            <span
                                className="inline-block text-xs text-white/60 leading-[12px]"
                                style={{
                                    animation: 'marquee 20s linear infinite',
                                }}
                            >
                                Çukurova Üniversitesi yemekhane uygulaması.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Çukurova Üniversitesi yemekhane uygulaması.
                            </span>
                        </div>
                        {/* Static text for larger screens */}
                        <span className="hidden sm:block text-xs text-white/60 leading-[12px] truncate">
                            Çukurova Üniversitesi yemekhane uygulaması.
                        </span>
                    </div>
                </div>

                <Button
                    onClick={handleInstallClick}
                    variant="default"
                    size="sm"
                    className="shrink-0 font-medium"
                >
                    Yükle
                </Button>
            </div>
        </div>
    )
}
