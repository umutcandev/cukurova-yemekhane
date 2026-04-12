"use client"

import { useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getInitials } from "@/components/comments/utils"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024
const AVATAR_SIZE = 512
const IMAGE_PROCESS_TIMEOUT = 10000

async function processAvatar(file: File): Promise<Blob> {
    const processPromise = new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const img = new window.Image()
            img.onload = () => {
                const srcSize = Math.min(img.width, img.height)
                const srcX = (img.width - srcSize) / 2
                const srcY = (img.height - srcSize) / 2

                const canvas = document.createElement("canvas")
                canvas.width = AVATAR_SIZE
                canvas.height = AVATAR_SIZE
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    reject(new Error("Canvas 2D context not available"))
                    return
                }
                ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, AVATAR_SIZE, AVATAR_SIZE)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Canvas toBlob failed"))
                            return
                        }
                        resolve(blob)
                    },
                    "image/webp",
                    0.9
                )
            }
            img.onerror = () => reject(new Error("Image load failed"))
            img.src = reader.result as string
        }
        reader.onerror = () => reject(new Error("FileReader failed"))
        reader.readAsDataURL(file)
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Fotoğraf işleme zaman aşımına uğradı.")), IMAGE_PROCESS_TIMEOUT)
    )

    return Promise.race([processPromise, timeoutPromise])
}

interface AvatarUploaderProps {
    displayName: string | null
    displayImage: string | null
    hasCustomImage: boolean
    onUploaded: (publicUrl: string) => void
    onRemoved: () => void
}

export function AvatarUploader({
    displayName,
    displayImage,
    hasCustomImage,
    onUploaded,
    onRemoved,
}: AvatarUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Sadece JPEG, PNG veya WebP yükleyebilirsiniz.")
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error("Dosya boyutu en fazla 10MB olabilir.")
            return
        }

        setIsUploading(true)
        try {
            const blob = await processAvatar(file)

            const formData = new FormData()
            formData.append("file", blob, "avatar.webp")

            const res = await fetch("/api/user/avatar", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Fotoğraf yüklenemedi.")
            }

            onUploaded(data.publicUrl)
            toast.success("Profil fotoğrafı güncellendi.")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fotoğraf yüklenemedi.")
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch("/api/user/avatar", { method: "DELETE" })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Fotoğraf kaldırılamadı.")
            }
            onRemoved()
            toast.success("Profil fotoğrafı kaldırıldı.")
            setConfirmOpen(false)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fotoğraf kaldırılamadı.")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                {/* Body — title + description left, avatar right */}
                <div className="flex items-start justify-between gap-6 px-5 pt-5 pb-4">
                    <div className="space-y-1">
                        <h3 className="text-md font-semibold text-foreground leading-none">
                            Profil Fotoğrafı
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Profil fotoğrafınızı değiştirmek için fotoğrafa dokunun.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading || isDeleting}
                        className="relative flex-shrink-0 group cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Avatar className="h-[68px] w-[68px] ring-1 ring-border/50 transition-shadow group-hover:ring-border">
                            <AvatarImage src={displayImage || ""} alt={displayName || ""} />
                            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                        )}
                        {!isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors">
                                <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </button>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 border-t border-border/40 bg-muted/30 px-4 py-2">
                    <p className="text-xs text-muted-foreground">
                        Profil fotoğrafı isteğe bağlıdır.
                    </p>
                    {hasCustomImage && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs flex-shrink-0"
                            onClick={() => setConfirmOpen(true)}
                            disabled={isUploading || isDeleting}
                        >
                            Kaldır
                        </Button>
                    )}
                </div>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fotoğrafı Kaldır</AlertDialogTitle>
                        <AlertDialogDescription>
                            Yüklediğiniz profil fotoğrafı silinecek ve Google hesabınızdaki fotoğrafa
                            geri dönülecek. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleRemove()
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Kaldır"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
