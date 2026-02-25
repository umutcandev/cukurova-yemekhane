"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Home, Bookmark, Flame, Monitor, Sun, Moon, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AuthDrawer } from "@/components/auth-drawer"
import { AUTH_ENABLED } from "@/lib/feature-flags"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { usePwaInstall } from "@/hooks/use-pwa-install"

function GoogleIcon({ className }: { className?: string }) {
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

function ThemeToggleBar() {
    const { setTheme, theme } = useTheme()

    const options = [
        { value: "system", icon: Monitor, label: "Sistem" },
        { value: "light", icon: Sun, label: "Açık" },
        { value: "dark", icon: Moon, label: "Koyu" },
    ] as const

    return (
        <div className="flex items-center justify-between h-12 px-1">
            <span className="text-base text-muted-foreground">Tema</span>
            <div className="flex items-center gap-0.5 rounded-[11px] border border-border/60 bg-muted/30 p-0.5">
                {options.map(({ value, icon: Icon }) => (
                    <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`relative rounded-lg p-1.5 transition-all duration-200 ${theme === value
                            ? "bg-foreground text-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                ))}
            </div>
        </div>
    )
}

interface MobileMenuProps {
    isOpen: boolean
    onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
    if (!AUTH_ENABLED) {
        return <MobileMenuDisabled isOpen={isOpen} onClose={onClose} />
    }
    return <MobileMenuEnabled isOpen={isOpen} onClose={onClose} />
}

function MobileMenuDisabled({ isOpen, onClose }: MobileMenuProps) {
    const { isInstallable, install } = usePwaInstall()
    const [authDrawerOpen, setAuthDrawerOpen] = useState(false)

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] dark text-foreground bg-background"
                    >
                        {/* Header with close button */}
                        <div className="container mx-auto px-4 py-3">
                            <div className="flex items-center justify-end min-h-9">
                                <button
                                    onClick={onClose}
                                    className="flex items-center justify-center h-8 w-8 rounded-full border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <motion.svg
                                        initial={{ rotate: -90 }}
                                        animate={{ rotate: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        width="16" height="16" viewBox="0 0 16 16" fill="currentColor" strokeLinejoin="round" style={{ color: 'currentcolor' }}
                                    >
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z" />
                                    </motion.svg>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="px-5 pt-2 pb-8">
                                {/* Auth disabled banner + disabled button */}
                                <div className="space-y-2.5 mb-5">
                                    <Button
                                        className="w-full h-10 text-sm font-medium gap-3"
                                        disabled
                                    >
                                        <GoogleIcon className="h-5 w-5" />
                                        Google ile Giriş Yap
                                        <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                                            Devre Dışı
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 text-sm font-medium border-border/60"
                                        asChild
                                    >
                                        <Link href="mailto:hi@umutcan.xyz">
                                            İletişime Geç
                                        </Link>
                                    </Button>
                                </div>

                                {/* Navigation Links — unauth mode */}
                                <nav>
                                    <Link
                                        href="/"
                                        onClick={onClose}
                                        className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <span>Ana Sayfa</span>
                                        <Home className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => setAuthDrawerOpen(true)}
                                        className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                    >
                                        <span>Favorilerim</span>
                                        <Bookmark className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setAuthDrawerOpen(true)}
                                        className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                    >
                                        <span>Kalori Takibi</span>
                                        <Flame className="h-4 w-4" />
                                    </button>

                                    {isInstallable && (
                                        <button
                                            onClick={() => {
                                                install()
                                                onClose()
                                            }}
                                            className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                        >
                                            <span>Uygulamayı Yükle</span>
                                            <Download className="h-4 w-4" />
                                        </button>
                                    )}
                                </nav>

                                {/* Theme Toggle */}
                                <div>
                                    <ThemeToggleBar />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Auth Drawer */}
            <AuthDrawer
                open={authDrawerOpen}
                onOpenChange={setAuthDrawerOpen}
                message="Bu özelliği kullanabilmek için giriş yapmanız gerekiyor."
            />
        </>
    )
}

function MobileMenuEnabled({ isOpen, onClose }: MobileMenuProps) {
    const { data: session, status } = useSession()
    const { isInstallable, install } = usePwaInstall()
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [authDrawerOpen, setAuthDrawerOpen] = useState(false)

    const handleSignIn = async () => {
        setIsSigningIn(true)
        await signIn("google")
    }

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] dark text-foreground bg-background"
                    >
                        {/* Header with close button — mirrors header layout */}
                        <div className="container mx-auto px-4 py-3">
                            <div className="flex items-center justify-end min-h-9">
                                <button
                                    onClick={onClose}
                                    className="flex items-center justify-center h-8 w-8 rounded-full border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <motion.svg
                                        initial={{ rotate: -90 }}
                                        animate={{ rotate: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        width="16" height="16" viewBox="0 0 16 16" fill="currentColor" strokeLinejoin="round" style={{ color: 'currentcolor' }}
                                    >
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z" />
                                    </motion.svg>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="px-5 pt-2 pb-8">
                                {/* Unauth: Giriş Yap + İletişime Geç */}
                                {status !== "loading" && !session && (
                                    <div className="space-y-2.5 mb-5">
                                        <Button
                                            className="w-full h-10 text-sm font-medium gap-3"
                                            onClick={handleSignIn}
                                            disabled={isSigningIn}
                                        >
                                            {isSigningIn ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <GoogleIcon className="h-5 w-5" />
                                            )}
                                            Google ile Giriş Yap
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full h-10 text-sm font-medium border-border/60"
                                            asChild
                                        >
                                            <Link href="mailto:hi@umutcan.xyz">
                                                İletişime Geç
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                {/* Auth: İletişime Geç (CTA) then profile */}
                                {status !== "loading" && session && (
                                    <div className="mb-5">
                                        <Button
                                            variant="outline"
                                            className="w-full h-10 text-sm font-medium border-border/60 mb-4"
                                            asChild
                                        >
                                            <Link href="mailto:hi@umutcan.xyz">
                                                İletişime Geç
                                            </Link>
                                        </Button>
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                                <span className="text-base font-semibold truncate">
                                                    {session.user?.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {session.user?.email}
                                                </span>
                                            </div>
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarImage
                                                    src={session.user?.image || ""}
                                                    alt={session.user?.name || ""}
                                                />
                                                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Links */}
                                <nav>
                                    {session ? (
                                        <>
                                            <Link
                                                href="/"
                                                onClick={onClose}
                                                className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <span>Ana Sayfa</span>
                                                <Home className="h-4 w-4" />
                                            </Link>
                                            <Link
                                                href="/favorilerim"
                                                onClick={onClose}
                                                className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <span>Favorilerim</span>
                                                <Bookmark className="h-4 w-4" />
                                            </Link>
                                            <Link
                                                href="/kalori-takibi"
                                                onClick={onClose}
                                                className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <span>Kalori Takibi</span>
                                                <Flame className="h-4 w-4" />
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/"
                                                onClick={onClose}
                                                className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <span>Ana Sayfa</span>
                                                <Home className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => setAuthDrawerOpen(true)}
                                                className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                            >
                                                <span>Favorilerim</span>
                                                <Bookmark className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setAuthDrawerOpen(true)}
                                                className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                            >
                                                <span>Kalori Takibi</span>
                                                <Flame className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}

                                    {isInstallable && (
                                        <button
                                            onClick={() => {
                                                install()
                                                onClose()
                                            }}
                                            className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                        >
                                            <span>Uygulamayı Yükle</span>
                                            <Download className="h-4 w-4" />
                                        </button>
                                    )}
                                </nav>

                                {/* Theme Toggle */}
                                <div>
                                    <ThemeToggleBar />
                                </div>

                                {/* Sign Out (authenticated only) */}
                                {session && (
                                    <button
                                        onClick={() => {
                                            signOut()
                                            onClose()
                                        }}
                                        className="flex items-center gap-2 h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                    >
                                        <span>Çıkış Yap</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Auth Drawer for unauth users */}
            <AuthDrawer
                open={authDrawerOpen}
                onOpenChange={setAuthDrawerOpen}
                message="Bu özelliği kullanabilmek için giriş yapmanız gerekiyor."
            />
        </>
    )
}
