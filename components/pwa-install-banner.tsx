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
        <div className="dark w-full bg-[#101010] border-b border-white/10">
            <div className="container mx-auto flex items-center justify-between gap-4 p-3 px-4 sm:py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCloseClick}
                        className="text-white/50 hover:text-white transition-colors"
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1.5 sm:h-12 sm:w-12 sm:p-2">
                        <Image
                            src="/icon/icon-512x512.png"
                            alt="App Icon"
                            width={48}
                            height={48}
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white sm:text-base">Yemekhane</span>
                        <span className="text-xs text-white/60 sm:text-sm">
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
