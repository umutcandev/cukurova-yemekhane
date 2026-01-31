"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [shouldRender, setShouldRender] = useState(false)

    useEffect(() => {
        // Check if user has already dismissed the banner
        const isDismissed = localStorage.getItem("pwa-install-banner-closed")
        if (isDismissed) return

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShouldRender(true)
            // Small delay to trigger CSS transition
            requestAnimationFrame(() => {
                setIsVisible(true)
            })
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()

        const { outcome } = await deferredPrompt.userChoice
        if (outcome === "accepted") {
            handleClose()
        }
        setDeferredPrompt(null)
    }

    const handleClose = () => {
        setIsVisible(false)
        // Wait for transition to complete before removing from DOM
        setTimeout(() => {
            setShouldRender(false)
        }, 200)
    }

    const handleCloseClick = () => {
        handleClose()
        localStorage.setItem("pwa-install-banner-closed", "true")
    }

    if (!shouldRender) return null

    return (
        <div
            className={`dark w-full bg-[#101010] border-b border-white/10 transition-all duration-200 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                }`}
        >
            <div className="container mx-auto flex items-center justify-between gap-3 py-2 px-4">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleCloseClick}
                        className="text-white/50 hover:text-white transition-colors"
                        aria-label="Kapat"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1">
                        <Image
                            src="/icon/icon-512x512.png"
                            alt="App Icon"
                            width={20}
                            height={20}
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div className="flex flex-col gap-0">
                        <span className="text-xs font-semibold text-white leading-tight">Yemekhane</span>
                        <span className="text-[10px] text-white/60 leading-tight hidden sm:block">
                            Çukurova Üniversitesi yemekhane uygulaması.
                        </span>
                    </div>
                </div>

                <Button
                    onClick={handleInstallClick}
                    variant="default"
                    size="sm"
                    className="shrink-0 font-medium h-7 text-xs px-3"
                >
                    Yükle
                </Button>
            </div>
        </div>
    )
}
