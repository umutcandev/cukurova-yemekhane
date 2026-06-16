"use client"

import { useSession } from "next-auth/react"
import { AUTH_ENABLED } from "@/lib/feature-flags"

type SessionResult = ReturnType<typeof useSession>

const DISABLED_SESSION: SessionResult = {
    data: null,
    status: "unauthenticated",
    update: async () => null,
}

export function useSafeSession(): SessionResult {
    if (!AUTH_ENABLED) {
        return DISABLED_SESSION
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSession()
}
