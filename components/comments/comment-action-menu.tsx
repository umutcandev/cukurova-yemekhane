"use client"

import { Flag, Trash2, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Comment, Reply } from "./types"

interface CommentActionMenuProps {
    comment: Comment | Reply
    isMobile: boolean
    openMenuId: number | null
    onOpenMenuChange: (id: number | null) => void
    onReport: (comment: Comment | Reply) => void
    onDelete: (id: number) => void
    canDelete: boolean
    canReport: boolean
}

export function CommentActionMenu({
    comment,
    isMobile,
    openMenuId,
    onOpenMenuChange,
    onReport,
    onDelete,
    canDelete,
    canReport,
}: CommentActionMenuProps) {
    if (!canDelete && !canReport) return null

    if (isMobile) {
        return (
            <div className="relative shrink-0">
                <button
                    className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                    onClick={() => onOpenMenuChange(openMenuId === comment.id ? null : comment.id)}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenuId === comment.id && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => onOpenMenuChange(null)} />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[120px]">
                            {canReport && (
                                <button
                                    onClick={() => { onReport(comment); onOpenMenuChange(null) }}
                                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left"
                                >
                                    <Flag className="h-3.5 w-3.5" />
                                    Raporla
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => { onDelete(comment.id); onOpenMenuChange(null) }}
                                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Sil
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                {canReport && (
                    <DropdownMenuItem
                        onClick={() => onReport(comment)}
                        className="text-xs"
                    >
                        <Flag className="h-3.5 w-3.5 mr-2" />
                        Raporla
                    </DropdownMenuItem>
                )}
                {canDelete && (
                    <DropdownMenuItem
                        onClick={() => onDelete(comment.id)}
                        className="text-xs text-destructive focus:text-destructive"
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Sil
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
