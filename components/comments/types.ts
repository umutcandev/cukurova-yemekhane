export const CHAR_LIMIT = 200

export interface Reply {
    id: number
    userId: string
    userName: string | null
    userImage: string | null
    content: string
    imageUrl: string | null
    parentId: number
    createdAt: string
    reactions: Record<string, number>
    userReaction: string | null
}

export interface Comment {
    id: number
    userId: string
    userName: string | null
    userImage: string | null
    content: string
    imageUrl: string | null
    parentId: null
    createdAt: string
    replies: Reply[]
    reactions: Record<string, number>
    userReaction: string | null
}

export interface CommentsPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    menuDate: string
}
