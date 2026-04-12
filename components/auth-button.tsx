"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bookmark, Flame, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AUTH_ENABLED, PROFILE_CUSTOMIZATION_ENABLED } from "@/lib/feature-flags"
import { resolveSelfIdentity } from "@/lib/user-identity"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    const router = useRouter()
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

    const { displayName, displayImage } = resolveSelfIdentity({
        name: session.user?.name,
        image: session.user?.image,
        nickname: session.user?.nickname,
        customImage: session.user?.customImage,
    })

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={displayImage || ""} alt={displayName || ""} />
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                            {displayName?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-[256px] p-2 rounded-xl">
                {/* User info header */}
                <div className="px-2 pt-1 pb-2">
                    <p className="text-[14px] font-medium leading-tight truncate">{displayName}</p>
                    <p className="text-[13px] text-muted-foreground leading-tight mt-1 truncate">{session.user?.email}</p>
                </div>
                <DropdownMenuSeparator className="mx-0 -mx-2 my-0" />

                {/* Navigation items */}
                <div className="py-1.5">
                    {PROFILE_CUSTOMIZATION_ENABLED && (
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg h-9 px-2 gap-0 justify-between text-muted-foreground"
                            onSelect={() => router.push("/ayarlar")}
                        >
                            <span className="text-[14px]">Hesap Ayarları</span>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg h-9 px-2 gap-0 text-muted-foreground">
                        <Link href="/favorilerim" className="flex items-center justify-between w-full">
                            <span className="text-[14px]">Favorilerim</span>
                            <Bookmark className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg h-9 px-2 gap-0 text-muted-foreground">
                        <Link href="/kalori-takibi" className="flex items-center justify-between w-full">
                            <span className="text-[14px]">Kalori Takibi</span>
                            <Flame className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="-mx-2 my-0" />

                {/* Log out */}
                <div className="pt-1.5">
                    <DropdownMenuItem
                        className="cursor-pointer rounded-lg h-9 px-2 gap-0 justify-between text-muted-foreground"
                        onClick={() => signOut()}
                    >
                        <span className="text-[14px]">Çıkış Yap</span>
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
