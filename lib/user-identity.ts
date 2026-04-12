export interface PublicIdentityInput {
    name: string | null;
    image: string | null;
    nickname: string | null;
    customImage: string | null;
    hideProfilePicture: boolean;
}

export interface ResolvedIdentity {
    displayName: string | null;
    displayImage: string | null;
}

// What other users see — respects hideProfilePicture.
export function resolvePublicIdentity(u: PublicIdentityInput): ResolvedIdentity {
    return {
        displayName: u.nickname ?? u.name,
        displayImage: u.hideProfilePicture ? null : (u.customImage ?? u.image),
    };
}

// What the user themselves sees — hideProfilePicture only affects others.
export function resolveSelfIdentity(u: {
    name: string | null | undefined;
    image: string | null | undefined;
    nickname: string | null | undefined;
    customImage: string | null | undefined;
}): ResolvedIdentity {
    return {
        displayName: u.nickname ?? u.name ?? null,
        displayImage: u.customImage ?? u.image ?? null,
    };
}
