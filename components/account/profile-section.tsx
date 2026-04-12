"use client"

import { AvatarUploader } from "./avatar-uploader"
import { NicknameField } from "./nickname-field"

interface ProfileSectionProps {
    displayName: string | null
    displayImage: string | null
    nickname: string | null
    fallbackName: string | null
    hasCustomImage: boolean
    onAvatarUploaded: (publicUrl: string) => void
    onAvatarRemoved: () => void
    onNicknameSaved: (nickname: string | null) => void
}

export function ProfileSection({
    displayName,
    displayImage,
    nickname,
    fallbackName,
    hasCustomImage,
    onAvatarUploaded,
    onAvatarRemoved,
    onNicknameSaved,
}: ProfileSectionProps) {
    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Profil</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Profilinizin görünümünü düzenleyin.
                </p>
            </div>

            <div className="space-y-3">
                <AvatarUploader
                    displayName={displayName}
                    displayImage={displayImage}
                    hasCustomImage={hasCustomImage}
                    onUploaded={onAvatarUploaded}
                    onRemoved={onAvatarRemoved}
                />

                <NicknameField
                    initialNickname={nickname}
                    fallbackName={fallbackName}
                    onSaved={onNicknameSaved}
                />
            </div>
        </section>
    )
}
