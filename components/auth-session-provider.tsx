"use client"

import { SessionProvider } from "next-auth/react"
import { AUTH_ENABLED } from "@/lib/feature-flags"
import type { ReactNode } from "react"

/**
 * Auth kapalıysa SessionProvider render etmez.
 * Bu sayede her sayfa yüklemesinde otomatik yapılan
 * /api/auth/session edge request'i tamamen engellenir.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
    if (!AUTH_ENABLED) {
        return <>{children}</>
    }

    return <SessionProvider>{children}</SessionProvider>
}
