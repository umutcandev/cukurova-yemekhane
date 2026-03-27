"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMenuData } from "@/components/menu-data-provider"
import { ArrowRight } from "lucide-react"

// ─── Steps ──────────────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
    {
        title: "Favori yemek bildirimleri",
        description:
            "Sevdiğiniz yemekleri favorilere ekleyin, menüde yer aldığı gün e-posta ile bilgilendirelim. Artık favori yemeklerinizi kaçırmayın!",
        video: "/onboarding/step1.mp4",
    },
    {
        title: "Yemek günlüğü ve kalori takibi",
        description:
            "Yediğiniz yemekleri günlük olarak işaretleyin ve toplam kalori alımınızı takip edin. Kişisel hedefinize göre ilerlemenizi görün.",
        video: "/onboarding/step2.mp4",
    },
    {
        title: "Yapay zeka destekli menü analizi",
        description:
            "Günün menüsünü yapay zekaya analiz ettirin; besin değeri, denge ve öneriler hakkında anında yorum alın.",
        video: "/onboarding/step3.mp4",
    },
    {
        title: "Yorumlar, beğeniler ve sosyal etkileşim",
        description:
            "Günün menüsüne yorum yapın, diğer kullanıcıların düşüncelerini okuyun ya da tepkinizi gösterin.",
        video: "/onboarding/step4.mp4",
    },
    {
        title: "Takvim, yemek arama ve daha fazlası",
        description:
            "Takvimden istediğiniz günün menüsüne göz atın, aradığınız yemeği kolayca bulun. Hemen başlayın!",
        video: "/onboarding/step5.mp4",
    },
]

// ─── Step Video ─────────────────────────────────────────────────────────────

function StepVideo({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        video.currentTime = 0
        video.play().catch(() => {})
    }, [src])

    return (
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <video
                ref={videoRef}
                src={src}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
            />
        </div>
    )
}

// ─── Step Content ───────────────────────────────────────────────────────────

function OnboardingStepContent({
    step,
    currentStep,
    totalSteps,
    onNext,
    onSkip,
    onFinish,
    disabled,
}: {
    step: (typeof ONBOARDING_STEPS)[number]
    currentStep: number
    totalSteps: number
    onNext: () => void
    onSkip: () => void
    onFinish: () => void
    disabled: boolean
}) {
    const isLastStep = currentStep === totalSteps - 1

    return (
        <div className="flex flex-col">
            {/* Image + Text with animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Video */}
                    <StepVideo src={step.video} />

                    {/* Text */}
                    <div className="mt-4 space-y-1.5 px-1">
                        <h3 className="text-base font-semibold leading-tight">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Footer: dots + buttons */}
            <div className="mt-6 flex items-center justify-between px-1">
                {/* Dot indicators */}
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <motion.span
                            key={i}
                            className="h-2 rounded-full"
                            animate={{
                                width: i === currentStep ? 16 : 8,
                                backgroundColor: i === currentStep
                                    ? "var(--foreground)"
                                    : "color-mix(in srgb, var(--muted-foreground) 30%, transparent)",
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                            }}
                        />
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSkip}
                        disabled={disabled}
                        className="text-xs text-muted-foreground"
                    >
                        Atla
                    </Button>
                    {isLastStep ? (
                        <Button size="sm" onClick={onFinish} disabled={disabled}>
                            Başla
                        </Button>
                    ) : (
                        <Button size="sm" onClick={onNext} disabled={disabled}>
                            İleri
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Modal ──────────────────────────────────────────────────────────────────

export function OnboardingModal() {
    const { onboardingCompleted, completeOnboarding, isAuthenticated } = useMenuData()
    const isMobile = useIsMobile()
    const [currentStep, setCurrentStep] = useState(0)
    const [isClosing, setIsClosing] = useState(false)
    const [videosReady, setVideosReady] = useState(false)

    const shouldShow = isAuthenticated && onboardingCompleted === false

    // Preload all videos before showing the modal
    useEffect(() => {
        if (!shouldShow) return

        let cancelled = false
        const videos: HTMLVideoElement[] = []
        const promises = ONBOARDING_STEPS.map(
            (step) =>
                new Promise<void>((resolve) => {
                    const video = document.createElement("video")
                    videos.push(video)
                    video.preload = "auto"
                    video.muted = true
                    video.onloadeddata = () => resolve()
                    video.onerror = () => resolve() // don't block on failure
                    video.src = step.video
                })
        )

        Promise.all(promises).then(() => {
            if (!cancelled) setVideosReady(true)
        })

        return () => {
            cancelled = true
            videos.forEach((v) => { v.onloadeddata = null; v.onerror = null; v.src = ""; v.load() })
        }
    }, [shouldShow])

    const handleComplete = useCallback(async () => {
        if (isClosing) return
        setIsClosing(true)
        await completeOnboarding()
        setIsClosing(false)
    }, [completeOnboarding, isClosing])

    const handleNext = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1))
    }, [])

    if (!shouldShow || !videosReady) return null

    const stepContent = (
        <OnboardingStepContent
            step={ONBOARDING_STEPS[currentStep]}
            currentStep={currentStep}
            totalSteps={ONBOARDING_STEPS.length}
            onNext={handleNext}
            onSkip={handleComplete}
            onFinish={handleComplete}
            disabled={isClosing}
        />
    )

    if (isMobile) {
        return (
            <Drawer open onOpenChange={(o) => !o && handleComplete()}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader className="text-center sr-only">
                            <DrawerTitle>Hoş geldiniz</DrawerTitle>
                            <DrawerDescription>Uygulamayı keşfedin</DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-6 pt-2">
                            {stepContent}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open onOpenChange={(o) => !o && handleComplete()}>
            <DialogContent className="sm:max-w-md p-6">
                <DialogHeader className="sr-only">
                    <DialogTitle>Hoş geldiniz</DialogTitle>
                    <DialogDescription>Uygulamayı keşfedin</DialogDescription>
                </DialogHeader>
                {stepContent}
            </DialogContent>
        </Dialog>
    )
}
