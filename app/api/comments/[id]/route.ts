import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db/index";
import { comments } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL, assertR2Config } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limiter";

const MODERATOR_USER_ID = process.env.MODERATOR_USER_ID?.trim() || undefined;
const DELETE_RATE_LIMIT = 10; // 10 deletions per minute

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

        // Rate limit by user ID
        const rateLimit = await checkRateLimit(session.user.id, {
            prefix: "comment-delete",
            maxRequests: DELETE_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla silme isteği. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
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

        // Fetch the comment + all its replies for ownership check and R2 cleanup
        const rows = await db
            .select({ id: comments.id, userId: comments.userId, imageUrl: comments.imageUrl })
            .from(comments)
            .where(or(eq(comments.id, commentId), eq(comments.parentId, commentId)));

        const comment = rows.find(r => r.id === commentId);

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

        // Delete R2 images for the comment and all its replies (only if R2 is configured)
        let r2Configured = true;
        try { assertR2Config(); } catch { r2Configured = false; }

        const imageUrls = r2Configured
            ? rows
                .map(r => r.imageUrl)
                .filter((url): url is string => !!url && !!R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL))
            : [];

        const failedR2Deletions: string[] = [];
        for (const imageUrl of imageUrls) {
            try {
                const key = imageUrl.replace(`${R2_PUBLIC_URL}/`, "");
                await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
            } catch (r2Error) {
                console.error("R2 delete error:", r2Error);
                failedR2Deletions.push(imageUrl);
            }
        }

        await db.delete(comments).where(eq(comments.id, commentId));

        if (failedR2Deletions.length > 0) {
            return NextResponse.json({
                success: true,
                warning: "Yorum silindi ancak bazı fotoğraflar temizlenemedi.",
                failedImages: failedR2Deletions,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Comment DELETE error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}
