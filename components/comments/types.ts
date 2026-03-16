export const CHAR_LIMIT = 200

export interface Reply {
    id: number
    userId: string
    userName: string | null
    userImage: string | null
    content: string
    parentId: number
    createdAt: string
}

export interface Comment {
    id: number
    userId: string
    userName: string | null
    userImage: string | null
    content: string
    parentId: null
    createdAt: string
    replies: Reply[]
}

export interface CommentsPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    menuDate: string
}
