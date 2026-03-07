import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { comments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

const MODERATOR_USER_ID = process.env.MODERATOR_USER_ID?.trim() || undefined;

// DELETE /api/comments/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Yorum silmek için giriş yapmalısınız." },
                { status: 401 }
            );
        }

        const { id } = await params;
        const commentId = parseInt(id, 10);

        if (isNaN(commentId)) {
            return NextResponse.json(
                { error: "Geçersiz yorum ID." },
                { status: 400 }
            );
        }

        // Fetch the comment to check ownership
        const [comment] = await db
            .select({ userId: comments.userId })
            .from(comments)
            .where(eq(comments.id, commentId));

        if (!comment) {
            return NextResponse.json(
                { error: "Yorum bulunamadı." },
                { status: 404 }
            );
        }

        // Only the author or the moderator can delete
        const isOwner = comment.userId === session.user.id;
        const isModerator = MODERATOR_USER_ID && session.user.id === MODERATOR_USER_ID;

        if (!isOwner && !isModerator) {
            return NextResponse.json(
                { error: "Bu yorumu silme yetkiniz yok." },
                { status: 403 }
            );
        }

        await db.delete(comments).where(eq(comments.id, commentId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Comment DELETE error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
