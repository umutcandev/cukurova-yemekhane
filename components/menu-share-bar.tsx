"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download, Copy, Share2, Loader2, Check } from "lucide-react"
import { toPng } from "html-to-image"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"

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
        // Wrapper: viewport dışına taşınmış, overflow hidden - görünmez ama içerik render ediliyor
        <div
            aria-hidden="true"
            style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: "1px",
                height: "1px",
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                border: 0,
            }}
        >
            <div
                ref={templateRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "420px",
                    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
                    background: "#0a0a0a",
                    borderRadius: "16px",
                    padding: "28px",
                    color: "#fafafa",
                }}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <div style={{
                        fontSize: "22px",
                        fontWeight: "700",
                        color: "#fafafa",
                        letterSpacing: "-0.025em",
                        marginBottom: "6px"
                    }}>
                        Çukurova Yemekhane'de Bugün
                    </div>
                    <div style={{
                        fontSize: "13px",
                        color: "#a1a1aa",
                        fontWeight: "500"
                    }}>
                        {formattedDate}
                    </div>
                </div>

                {/* Table Container */}
                <div style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #27272a",
                    marginBottom: "20px",
                }}>
                    {/* Table Header */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "#121212",
                        borderBottom: "1px solid #27272a",
                    }}>
                        <span style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#71717a",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            Yemek
                        </span>
                        <span style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#71717a",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}>
                            Kalori
                        </span>
                    </div>

                    {/* Table Body - Zebra striped rows */}
                    {day.meals.map((meal, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 16px",
                                background: idx % 2 === 0 ? "#0a0a0a" : "#101010",
                                borderBottom: idx < day.meals.length - 1 ? "1px solid #27272a" : "none"
                            }}
                        >
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                maxWidth: "260px"
                            }}>
                                <span style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#fafafa",
                                }}>
                                    {meal.name}
                                </span>
                                {day.meals.length === 5 && idx === 0 && (
                                    <span style={{
                                        fontSize: "10px",
                                        fontWeight: "500",
                                        color: "#a1a1aa",
                                        background: "#27272a",
                                        borderRadius: "6px",
                                        padding: "2px 8px",
                                        whiteSpace: "nowrap",
                                        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                    }}>
                                        Ana Yemek
                                    </span>
                                )}
                                {day.meals.length === 5 && idx === 1 && (
                                    <span style={{
                                        fontSize: "10px",
                                        fontWeight: "500",
                                        color: "#a1a1aa",
                                        background: "#27272a",
                                        borderRadius: "6px",
                                        padding: "2px 8px",
                                        whiteSpace: "nowrap",
                                        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                    }}>
                                        Seçenek
                                    </span>
                                )}
                            </div>
                            <span style={{
                                fontSize: "13px",
                                color: "#a1a1aa",
                                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                                fontWeight: "500"
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
                    paddingTop: "16px",
                    borderTop: "1px solid #27272a"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: getCalorieColor(day.totalCalories)
                        }} />
                        <span style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#fafafa"
                        }}>
                            Toplam: {day.totalCalories} kcal
                        </span>
                    </div>
                    <div style={{
                        fontSize: "12px",
                        color: "#71717a",
                        fontWeight: "500"
                    }}>
                        www.cukurova.app
                    </div>
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

export function MenuShareButton({ day }: MenuShareBarProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const templateRef = useRef<HTMLDivElement>(null)

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
                    text: `${formatDateForShare(day.date)} menüsüne göz at! Menüyü daha detaylı incelemek için cukurova.app ziyaret etmeyi unutma.`,
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

    return (
        <>
            {/* Hidden template for image generation */}
            <ShareableMenuTemplate day={day} templateRef={templateRef} />

            <Button
                suppressHydrationWarning
                size="sm"
                variant="outline"
                onClick={handleShareClick}
                className="h-7 text-xs gap-1.5 px-2.5 border-border/40 transition-colors"
                title="Paylaş"
            >
                <Share2 className="w-3.5 h-3.5" />
                <span className="font-medium">Paylaş</span>
            </Button>

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
