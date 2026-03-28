"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Bookmark, Flame, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AUTH_ENABLED } from "@/lib/feature-flags"
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
import { AuthModal } from "@/components/auth-modal"

export function AuthButton() {
    if (!AUTH_ENABLED) {
        return <AuthButtonDisabled />
    }

    return <AuthButtonEnabled />
}

function AuthButtonDisabled() {
    const [authOpen, setAuthOpen] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 opacity-60 cursor-not-allowed"
                onClick={() => setAuthOpen(true)}
            >
                Giriş Yap
            </Button>

            <AuthModal
                open={authOpen}
                onOpenChange={setAuthOpen}
            />
        </>
    )
}

function AuthButtonEnabled() {
    const { data: session, status } = useSession()
    const [authOpen, setAuthOpen] = useState(false)

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

                <AuthModal
                    open={authOpen}
                    onOpenChange={setAuthOpen}
                />
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
            <DropdownMenuContent align="end" className="w-40 p-0 rounded-lg overflow-hidden">
                <DropdownMenuLabel className="font-normal px-3 py-2">
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                        <p className="text-sm font-semibold leading-none truncate">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-0" />
                <div className="p-1">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2.5 py-1.5 gap-2">
                        <Link href="/favorilerim" className="flex items-center w-full">
                            <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">Favorilerim</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md px-2.5 py-1.5 gap-2">
                        <Link href="/kalori-takibi" className="flex items-center w-full">
                            <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">Kalori Takibi</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                        className="cursor-pointer rounded-md px-2.5 py-1.5 gap-2"
                        onClick={() => signOut()}
                    >
                        <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">Çıkış Yap</span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
