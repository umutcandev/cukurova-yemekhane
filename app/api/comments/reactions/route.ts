import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { comments, commentReactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { VALID_EMOJI_KEYS } from "@/lib/emoji-constants";
import { createNotification } from "@/lib/notifications";

const REACTION_RATE_LIMIT = 20;

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Tepki bırakmak için giriş yapmalısınız." },
                { status: 401 }
            );
        }

        const rateLimit = await checkRateLimit(session.user.id, {
            prefix: "comment-reaction",
            maxRequests: REACTION_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla istek gönderdiniz. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { commentId, emoji } = body;

        if (typeof commentId !== "number" || !Number.isInteger(commentId) || commentId <= 0) {
            return NextResponse.json(
                { error: "Geçersiz commentId." },
                { status: 400 }
            );
        }

        if (typeof emoji !== "string" || !VALID_EMOJI_KEYS.has(emoji)) {
            return NextResponse.json(
                { error: "Geçersiz emoji." },
                { status: 400 }
            );
        }

        // Verify comment exists
        const [comment] = await db
            .select({ id: comments.id, userId: comments.userId })
            .from(comments)
            .where(eq(comments.id, commentId));

        if (!comment) {
            return NextResponse.json(
                { error: "Yorum bulunamadı." },
                { status: 404 }
            );
        }

        // Check existing reaction from this user on this comment
        const [existing] = await db
            .select({ id: commentReactions.id, emoji: commentReactions.emoji })
            .from(commentReactions)
            .where(
                and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, session.user.id)
                )
            );

        let action: "added" | "removed" | "changed";

        if (existing) {
            if (existing.emoji === emoji) {
                // Same emoji — remove (toggle off)
                await db
                    .delete(commentReactions)
                    .where(eq(commentReactions.id, existing.id));
                action = "removed";
            } else {
                // Different emoji — update
                await db
                    .update(commentReactions)
                    .set({ emoji, createdAt: new Date() })
                    .where(eq(commentReactions.id, existing.id));
                action = "changed";
            }
        } else {
            // No existing reaction — insert
            await db.insert(commentReactions).values({
                commentId,
                userId: session.user.id,
                emoji,
            });
            action = "added";
        }

        // Tepki eklendiğinde veya değiştiğinde bildirim oluştur
        if (action === "added" || action === "changed") {
            try {
                await createNotification({
                    userId: comment.userId,
                    actorId: session.user.id,
                    type: "reaction",
                    commentId,
                });
            } catch (notifError) {
                console.error("Reaction notification error:", notifError);
            }
        }

        // Fetch updated aggregated reactions for this comment
        const reactionRows = await db
            .select({
                emoji: commentReactions.emoji,
                count: sql<number>`count(*)::int`,
            })
            .from(commentReactions)
            .where(eq(commentReactions.commentId, commentId))
            .groupBy(commentReactions.emoji);

        const reactions: Record<string, number> = {};
        for (const row of reactionRows) {
            reactions[row.emoji] = row.count;
        }

        // Fetch current user's reaction
        const [userRow] = await db
            .select({ emoji: commentReactions.emoji })
            .from(commentReactions)
            .where(
                and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, session.user.id)
                )
            );

        return NextResponse.json({
            action,
            reactions,
            userReaction: userRow?.emoji ?? null,
        });
    } catch (error) {
        console.error("Comment reaction error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}
