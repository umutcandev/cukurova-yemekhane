"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronRight, Download, Copy, Share2, Loader2, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toPng } from "html-to-image"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Types
interface Meal {
    id: string
    name: string
    calories: number
}

interface MenuDay {
    ymk: number
    date: string
    meals: Meal[]
    totalCalories: number
}

interface MenuShareBarProps {
    day: MenuDay
}

// Helper function to format date
function formatDateForShare(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Istanbul",
    })
}

// Shareable Menu Template Component
function ShareableMenuTemplate({ day, templateRef }: { day: MenuDay; templateRef: React.RefObject<HTMLDivElement | null> }) {
    const formattedDate = formatDateForShare(day.date)

    const getCalorieColor = (cal: number) => {
        if (cal < 800) return "#22c55e"
        if (cal < 1100) return "#f59e0b"
        return "#ef4444"
    }

    return (
        <div
            ref={templateRef}
            style={{
                position: "fixed",
                left: "0",
                top: "0",
                zIndex: -9999,
                pointerEvents: "none",
                width: "400px",
                fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
                background: "#000000",
                borderRadius: "20px",
                padding: "24px",
                color: "#ffffff",
                border: "1px solid #333333",
            }}
        >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#ffffff",
                    marginBottom: "8px"
                }}>
                    Çukurova Yemekhane'de Bugün
                </div>
                <div style={{ fontSize: "14px", color: "#ffffff" }}>
                    {formattedDate}
                </div>
            </div>

            {/* Meals */}
            <div style={{
                background: "#000000",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                border: "1px solid #333333"
            }}>
                {day.meals.map((meal, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 0",
                            borderBottom: idx < day.meals.length - 1 ? "1px solid #000000" : "none"
                        }}
                    >
                        <span style={{ fontSize: "15px", fontWeight: "500", color: "#ffffff" }}>{meal.name}</span>
                        <span style={{
                            fontSize: "12px",
                            color: "#ffffff",
                            background: "#000000",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontFamily: "var(--font-geist-mono), ui-monospace, monospace"
                        }}>
                            {meal.calories} kcal
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "1px solid #000000"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: getCalorieColor(day.totalCalories)
                    }} />
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>
                        Toplam: {day.totalCalories} kcal
                    </span>
                </div>
                <div style={{ fontSize: "12px", color: "#ffffff" }}>
                    https://www.cukurova.app
                </div>
            </div>
        </div>
    )
}

// Share Dialog Component
interface ShareDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    isGenerating: boolean
    generatedImage: string | null
    copied: boolean
    onDownload: () => void
    onCopyLink: () => void
    onNativeShare: () => void
}

function ShareDialog({
    isOpen,
    onOpenChange,
    isGenerating,
    generatedImage,
    copied,
    onDownload,
    onCopyLink,
    onNativeShare,
}: ShareDialogProps) {
    const isImageReady = !isGenerating && generatedImage !== null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Menüyü Paylaş
                    </DialogTitle>
                    <DialogDescription>
                        Menü görselini indir veya arkadaşlarınla paylaş.
                    </DialogDescription>
                </DialogHeader>

                {/* Generated Image Preview */}
                <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-muted/50 border border-border/40">
                    {isGenerating ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Görsel oluşturuluyor...</p>
                        </div>
                    ) : generatedImage ? (
                        <img
                            src={generatedImage}
                            alt="Menü Görseli"
                            className="w-full h-full object-contain"
                        />
                    ) : null}
                </div>

                {/* Action Buttons */}
                <DialogFooter className="flex-row gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={onDownload}
                        disabled={!isImageReady}
                    >
                        <Download className="h-4 w-4" />
                        İndir
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={onCopyLink}
                        disabled={isGenerating}
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-green-500" />
                                Kopyalandı!
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Link Kopyala
                            </>
                        )}
                    </Button>

                    <Button
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={onNativeShare}
                        disabled={!isImageReady}
                    >
                        <Share2 className="h-4 w-4" />
                        Paylaş
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function MenuShareBar({ day }: MenuShareBarProps) {
    const [imagesLoaded, setImagesLoaded] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const templateRef = useRef<HTMLDivElement>(null)

    // Sahte kullanıcılar - İleride gerçek data ile değiştirilebilir
    const sampleUsers = [
        { id: 1, name: "Cem Yılmaz", avatar: "/avatar-share-1.png" },
        { id: 2, name: "Cem Yılmaz", avatar: "/avatar-share-2.png" },
        { id: 3, name: "Cem Yılmaz", avatar: "/avatar-share-3.png" },
    ]

    // Resimleri preload et
    useEffect(() => {
        const imageUrls = sampleUsers.map(user => user.avatar)
        let loadedCount = 0
        let timeoutId: NodeJS.Timeout

        const preloadImages = imageUrls.map(src => {
            return new Promise<void>((resolve) => {
                const img = new Image()
                img.onload = () => {
                    loadedCount++
                    if (loadedCount === imageUrls.length) {
                        setImagesLoaded(true)
                    }
                    resolve()
                }
                img.onerror = () => {
                    loadedCount++
                    if (loadedCount === imageUrls.length) {
                        setImagesLoaded(true)
                    }
                    resolve()
                }
                img.src = src
            })
        })

        Promise.all(preloadImages)

        // Fallback: Show share bar after 2 seconds even if images haven't loaded
        timeoutId = setTimeout(() => {
            if (!imagesLoaded) {
                console.warn("Images took too long to load, showing share bar anyway")
                setImagesLoaded(true)
            }
        }, 2000)

        return () => {
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [])

    // Generate image function
    const generateImage = useCallback(async () => {
        if (!templateRef.current) return

        setIsGenerating(true)
        setGeneratedImage(null)

        try {
            // Small delay to ensure the template is rendered
            await new Promise(resolve => setTimeout(resolve, 100))

            const dataUrl = await toPng(templateRef.current, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: "#000000"
            })

            // Optional: Add a small artificial delay so the spinner is visible
            await new Promise(resolve => setTimeout(resolve, 300))

            setGeneratedImage(dataUrl)
        } catch (error) {
            console.error("Image generation failed:", error)
        } finally {
            setIsGenerating(false)
        }
    }, [])

    // Handle share button click
    const handleShareClick = useCallback(() => {
        setIsDialogOpen(true)
        generateImage()
    }, [generateImage])

    // Handle download
    const handleDownload = useCallback(() => {
        if (!generatedImage) return

        const link = document.createElement("a")
        link.download = `cukurova-menu-${day.date}.png`
        link.href = generatedImage
        link.click()
    }, [generatedImage, day.date])

    // Handle copy link with fallback for mobile
    const handleCopyLink = useCallback(async () => {
        const textToCopy = "https://www.cukurova.app"

        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
                return
            }
        } catch (error) {
            console.warn("Clipboard API failed, trying fallback:", error)
        }

        // Fallback method for mobile/unsupported browsers
        try {
            const textArea = document.createElement("textarea")
            textArea.value = textToCopy
            textArea.style.position = "fixed"
            textArea.style.left = "-999999px"
            textArea.style.top = "-999999px"
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()

            const successful = document.execCommand('copy')
            document.body.removeChild(textArea)

            if (successful) {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } else {
                console.error("Fallback copy failed")
            }
        } catch (error) {
            console.error("All copy methods failed:", error)
        }
    }, [])

    // Handle native share with fallback
    const handleNativeShare = useCallback(async () => {
        if (!generatedImage) return

        try {
            // Check if Web Share API is available
            if (!navigator.share) {
                // Fallback to download if share is not available
                console.warn("Share API not available, falling back to download")
                handleDownload()
                return
            }

            // Convert base64 to blob
            const response = await fetch(generatedImage)
            const blob = await response.blob()
            const file = new File([blob], `cukurova-menu-${day.date}.png`, { type: "image/png" })

            // Try to share with file first
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: "Çukurova Yemekhane Menüsü",
                    text: `${formatDateForShare(day.date)} menüsüne göz at!`,
                    files: [file],
                })
            } else {
                // Fallback to sharing just text and URL
                await navigator.share({
                    title: "Çukurova Yemekhane Menüsü",
                    text: `${formatDateForShare(day.date)} menüsüne göz at! https://www.cukurova.app`,
                })
            }
        } catch (error) {
            // User cancelled or share failed
            if ((error as Error).name !== "AbortError") {
                console.error("Share failed, falling back to download:", error)
                // Fallback to download on error
                handleDownload()
            }
        }
    }, [generatedImage, day.date, handleDownload])

    // Always show share button on mobile, will fallback to download if share fails

    return (
        <>
            {/* Hidden template for image generation */}
            <ShareableMenuTemplate day={day} templateRef={templateRef} />

            <div className="border-t border-border/40 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 overflow-hidden">
                <AnimatePresence>
                    {imagesLoaded && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            transition={{
                                duration: 0.35,
                                ease: [0.25, 0.46, 0.45, 0.94],
                                height: { duration: 0.3 }
                            }}
                            className="px-3 py-2.5"
                        >
                            <div className="flex items-center justify-between gap-3">
                                {/* Sol Kısım - Avatarlar ve Text */}
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    {/* Avatar Grubu */}
                                    <AvatarGroup>
                                        {sampleUsers.map((user) => (
                                            <Avatar
                                                key={user.id}
                                                className="size-7 border-2 border-background hover:scale-110 hover:z-10 transition-transform cursor-pointer"
                                            >
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback className="text-[10px] font-medium bg-gradient-to-br from-primary/20 to-primary/10">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}

                                        {/* +7 Statik Badge */}
                                        <AvatarGroupCount className="size-7 z-10 hover:scale-110 transition-transform cursor-pointer">
                                            +7
                                        </AvatarGroupCount>
                                    </AvatarGroup>

                                    {/* Text - Clickable */}
                                    <button
                                        onClick={handleShareClick}
                                        className="text-xs text-muted-foreground/80 leading-tight flex-1 min-w-0 text-left transition-colors cursor-pointer"
                                    >
                                        Sende bu menüyü arkadaşlarınla{" "}
                                        <span className="font-semibold text-foreground">hemen paylaş!</span>
                                    </button>
                                </div>

                                {/* Sağ Kısım - Share Butonu */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleShareClick}
                                    className="h-8 w-8 p-0 rounded-full bg-muted/50 hover:bg-muted border border-border/40 hover:border-border/60 transition-all group relative overflow-hidden"
                                >
                                    {/* Hover gradient background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Icon - No hover animation */}
                                    <ChevronRight className="h-4 w-4 text-foreground/70 group-hover:text-foreground transition-colors relative z-10" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Share Dialog */}
            <ShareDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                isGenerating={isGenerating}
                generatedImage={generatedImage}
                copied={copied}
                onDownload={handleDownload}
                onCopyLink={handleCopyLink}
                onNativeShare={handleNativeShare}
            />
        </>
    )
}
