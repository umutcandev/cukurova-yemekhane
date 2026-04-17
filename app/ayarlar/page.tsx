"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { ProfileSection } from "@/components/account/profile-section"
import { PrivacySection } from "@/components/account/privacy-section"
import { PROFILE_CUSTOMIZATION_ENABLED } from "@/lib/feature-flags"
import { resolveSelfIdentity } from "@/lib/user-identity"

interface ProfileState {
    name: string | null
    image: string | null
    nickname: string | null
    customImage: string | null
    hideProfilePicture: boolean
}

export default function AyarlarPage() {
    const router = useRouter()
    const { status, update } = useSession()

    const [profile, setProfile] = useState<ProfileState | null>(null)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
        }
    }, [status, router])

    useEffect(() => {
        if (status !== "authenticated") return
        let cancelled = false
        const load = async () => {
            try {
                const res = await fetch("/api/user/profile", { cache: "no-store" })
                if (!res.ok) throw new Error("load failed")
                const data = await res.json()
                if (cancelled) return
                setProfile({
                    name: data.name ?? null,
                    image: data.image ?? null,
                    nickname: data.nickname ?? null,
                    customImage: data.customImage ?? null,
                    hideProfilePicture: !!data.hideProfilePicture,
                })
            } catch (err) {
                console.error("[ayarlar] profile load failed:", err)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [status])

    if (!PROFILE_CUSTOMIZATION_ENABLED) {
        return (
            <main className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-6 max-w-2xl">
                    <Card className="bg-card p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Profil özelleştirme özelliği şu an devre dışı.
                        </p>
                    </Card>
                </div>
            </main>
        )
    }

    if (status === "loading" || profile === null) {
        return (
            <main className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </main>
        )
    }

    if (status !== "authenticated") {
        return null
    }

    const { displayName, displayImage } = resolveSelfIdentity(profile)

    const handleAvatarUploaded = async (publicUrl: string) => {
        setProfile({ ...profile, customImage: publicUrl })
        await update()
    }

    const handleAvatarRemoved = async () => {
        setProfile({ ...profile, customImage: null })
        await update()
    }

    const handleNicknameSaved = async (next: string | null) => {
        setProfile({ ...profile, nickname: next })
        await update()
    }

    const handlePrivacyChanged = async (hidden: boolean) => {
        setProfile({ ...profile, hideProfilePicture: hidden })
        await update()
    }

    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => router.push("/")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">
                            Hesap Ayarları
                        </h1>
                    </div>
                </div>

                <div className="space-y-6">
                    <ProfileSection
                        displayName={displayName}
                        displayImage={displayImage}
                        nickname={profile.nickname}
                        fallbackName={profile.name}
                        hasCustomImage={!!profile.customImage}
                        onAvatarUploaded={handleAvatarUploaded}
                        onAvatarRemoved={handleAvatarRemoved}
                        onNicknameSaved={handleNicknameSaved}
                    />

                    <PrivacySection
                        isHidden={profile.hideProfilePicture}
                        onChange={handlePrivacyChanged}
                    />
                </div>
            </div>
        </main>
    )
}
