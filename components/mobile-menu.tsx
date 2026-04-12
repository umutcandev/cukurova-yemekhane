"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Home, Bookmark, Flame, Monitor, Sun, Moon, Loader2, Settings } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AuthModal, GoogleIcon } from "@/components/auth-modal"
import { AUTH_ENABLED, PROFILE_CUSTOMIZATION_ENABLED } from "@/lib/feature-flags"
import { resolveSelfIdentity } from "@/lib/user-identity"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"



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
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={onClose}
                                    className="rounded-full"
                                >
                                    <motion.svg
                                        initial={{ rotate: -90 }}
                                        animate={{ rotate: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        width="16" height="16" viewBox="0 0 16 16" fill="currentColor" strokeLinejoin="round" style={{ color: 'currentcolor' }}
                                    >
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z" />
                                    </motion.svg>
                                </Button>
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
            <AuthModal
                open={authDrawerOpen}
                onOpenChange={setAuthDrawerOpen}
            />
        </>
    )
}

function MobileMenuEnabled({ isOpen, onClose }: MobileMenuProps) {
    const { data: session, status } = useSession()

    const [isSigningIn, setIsSigningIn] = useState(false)
    const [authDrawerOpen, setAuthDrawerOpen] = useState(false)

    const { displayName, displayImage } = resolveSelfIdentity({
        name: session?.user?.name,
        image: session?.user?.image,
        nickname: session?.user?.nickname,
        customImage: session?.user?.customImage,
    })

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
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={onClose}
                                    className="rounded-full"
                                >
                                    <motion.svg
                                        initial={{ rotate: -90 }}
                                        animate={{ rotate: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        width="16" height="16" viewBox="0 0 16 16" fill="currentColor" strokeLinejoin="round" style={{ color: 'currentcolor' }}
                                    >
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z" />
                                    </motion.svg>
                                </Button>
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
                                                    {displayName}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {session.user?.email}
                                                </span>
                                            </div>
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarImage
                                                    src={displayImage || ""}
                                                    alt={displayName || ""}
                                                />
                                                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                                    {displayName?.charAt(0)?.toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Links */}
                                <nav>
                                    {session ? (
                                        <>
                                            {PROFILE_CUSTOMIZATION_ENABLED && (
                                                <Link
                                                    href="/ayarlar"
                                                    onClick={onClose}
                                                    className="flex items-center justify-between h-12 px-1 text-base text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <span>Hesap Ayarları</span>
                                                    <Settings className="h-4 w-4" />
                                                </Link>
                                            )}
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
            <AuthModal
                open={authDrawerOpen}
                onOpenChange={setAuthDrawerOpen}
            />
        </>
    )
}
