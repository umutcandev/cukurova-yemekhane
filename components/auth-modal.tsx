"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { AUTH_ENABLED } from "@/lib/feature-flags"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

export function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className}>
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    )
}

function AuthContent({ disabled }: { disabled?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-4 py-2">
            {disabled && (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Giriş sistemi geçici olarak devre dışı
                </span>
            )}
            <Button
                className="w-full h-11 gap-3 text-sm font-medium"
                variant="outline"
                onClick={() => !disabled && signIn("google")}
                disabled={disabled}
            >
                <GoogleIcon className="h-5 w-5" />
                Google ile Giriş Yap
            </Button>
            <p className="text-center text-[11px] text-muted-foreground/60">
                {disabled
                    ? "Sistem bakım nedeniyle geçici olarak kapatılmıştır."
                    : "Ücretsiz hesabınızla tüm kişisel özelliklere erişin."
                }
            </p>
        </div>
    )
}

interface AuthModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    message?: string
}

export function AuthModal({ open, onOpenChange, message }: AuthModalProps) {
    const isMobile = useIsMobile()
    const disabled = !AUTH_ENABLED

    const title = (
        <>
            Giriş Yapın
            {disabled && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 align-middle">
                    Devre Dışı
                </span>
            )}
        </>
    )

    const description = disabled
        ? "Giriş sistemi şu anda geçici olarak devre dışıdır. Lütfen daha sonra tekrar deneyin."
        : (message || "Bu özelliği kullanabilmek için giriş yapmanız gerekiyor.")

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader className="text-center">
                            <DrawerTitle className="text-lg">{title}</DrawerTitle>
                            <DrawerDescription className="text-sm text-muted-foreground">
                                {description}
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-2">
                            <AuthContent disabled={disabled} />
                        </div>
                        <DrawerFooter className="pt-2">
                            <DrawerClose asChild>
                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                                    Vazgeç
                                </Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-lg">{title}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <AuthContent disabled={disabled} />
            </DialogContent>
        </Dialog>
    )
}
