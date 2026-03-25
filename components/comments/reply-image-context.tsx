"use client"

import { createContext, useContext } from "react"

interface ReplyImageContextValue {
    replyImagePreview: string | null
    replyImageFile: File | null
    replyImageLoading: boolean
    onReplyImageSelect: (file: File) => void
    onReplyImageClear: () => void
}

const ReplyImageContext = createContext<ReplyImageContextValue | null>(null)

export function ReplyImageProvider({
    children,
    value,
}: {
    children: React.ReactNode
    value: ReplyImageContextValue
}) {
    return (
        <ReplyImageContext.Provider value={value}>
            {children}
        </ReplyImageContext.Provider>
    )
}

export function useReplyImage() {
    const ctx = useContext(ReplyImageContext)
    if (!ctx) throw new Error("useReplyImage must be used within ReplyImageProvider")
    return ctx
}
