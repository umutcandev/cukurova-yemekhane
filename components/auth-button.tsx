"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useMediaQuery } from "@/hooks/use-media-query"

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

function AuthDialogContent({ onSignIn }: { onSignIn: () => void }) {
    return (
        <div className="flex flex-col items-center gap-4 py-2">
            <Button
                className="w-full h-11 gap-3 text-sm font-medium"
                variant="outline"
                onClick={onSignIn}
            >
                <GoogleIcon className="h-5 w-5" />
                Google ile Giriş Yap
            </Button>
            <div className="space-y-2 text-center">
                <p className="text-[11px] text-muted-foreground/60">
                    Yalnızca Google hesabınızla giriş yapabilirsiniz.
                </p>
            </div>
        </div>
    )
}

export function AuthButton() {
    const { data: session, status } = useSession()
    const [authOpen, setAuthOpen] = useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (status === "loading") {
        return (
            <div className="h-8 w-[72px] rounded-md bg-muted/50 animate-pulse" />
        )
    }

    if (!session) {
        return (
            <>
                <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => setAuthOpen(true)}
                >
                    Giriş Yap
                </Button>

                {isDesktop ? (
                    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader className="text-center">
                                <DialogTitle className="text-lg">Giriş Yapın</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Favori yemeklerinizi kaydedin ve kalori takibi yapın.
                                </DialogDescription>
                            </DialogHeader>
                            <AuthDialogContent onSignIn={() => signIn("google")} />
                        </DialogContent>
                    </Dialog>
                ) : (
                    <Drawer open={authOpen} onOpenChange={setAuthOpen}>
                        <DrawerContent>
                            <div className="mx-auto w-full max-w-sm">
                                <DrawerHeader className="text-center">
                                    <DrawerTitle className="text-lg">Giriş Yapın</DrawerTitle>
                                    <DrawerDescription className="text-sm text-muted-foreground">
                                        Favori yemeklerinizi kaydedin ve kalori takibi yapın.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <div className="px-4 pb-2">
                                    <AuthDialogContent onSignIn={() => signIn("google")} />
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
                )}
            </>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                            {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer">
                    <motion.div whileHover="hover">
                        <Link href="/favorilerim" className="flex items-center w-full">
                            <span className="text-xs">Favorilerim</span>
                            <motion.span
                                className="ml-auto"
                                variants={{
                                    hover: { opacity: 1, x: 0 }
                                }}
                                initial={{ opacity: 0, x: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />
                            </motion.span>
                        </Link>
                    </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                    <motion.div whileHover="hover">
                        <Link href="/kalori-takibi" className="flex items-center w-full">
                            <span className="text-xs">Kalori Takibi</span>
                            <motion.span
                                className="ml-auto"
                                variants={{
                                    hover: { opacity: 1, x: 0 }
                                }}
                                initial={{ opacity: 0, x: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />
                            </motion.span>
                        </Link>
                    </motion.div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer bg-destructive/10 text-destructive dark:bg-destructive/20 rounded-md"
                    variant="destructive"
                    onClick={() => signOut()}
                >
                    <span className="text-xs font-medium">Çıkış Yap</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
