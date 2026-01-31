"use client"

import { useState, useEffect, useCallback } from "react"

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstallable, setIsInstallable] = useState(false)

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setIsInstallable(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        // Check if app is already installed
        window.addEventListener("appinstalled", () => {
            setIsInstallable(false)
            setDeferredPrompt(null)
        })

        return () => {
            window.removeEventListener("beforeinstallprompt", handler)
        }
    }, [])

    const install = useCallback(async () => {
        if (!deferredPrompt) return false

        deferredPrompt.prompt()

        const { outcome } = await deferredPrompt.userChoice
        if (outcome === "accepted") {
            setIsInstallable(false)
            setDeferredPrompt(null)
            return true
        }
        return false
    }, [deferredPrompt])

    return { isInstallable, install }
}
