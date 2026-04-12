import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { comments, users, commentReactions, notifications } from "@/lib/db/schema";
import { eq, asc, desc, gt, lt, and, count, isNull, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { checkRateLimit, isValidDateFormat } from "@/lib/rate-limiter";
import { containsBadWord } from "@/lib/wordlist";
import { PHOTO_UPLOAD_ENABLED } from "@/lib/feature-flags";
import { getTurkeyDate } from "@/lib/date-utils";
import { createNotification } from "@/lib/notifications";
import { resolvePublicIdentity } from "@/lib/user-identity";
import { sanitizeHtml } from "@/lib/sanitize";

const MAX_COMMENT_LENGTH = 200;
const COMMENT_RATE_LIMIT = 5; // 5 comments per minute
const GET_RATE_LIMIT = 30; // 30 requests per minute for GET


interface CommentRow {
    id: number;
    userId: string;
    userName: string | null;
    userImage: string | null;
    content: string;
    imageUrl: string | null;
    parentId: number | null;
    createdAt: Date;
}

interface CommentWithReactions extends CommentRow {
    reactions: Record<string, number>;
    userReaction: string | null;
}

interface ThreadedComment extends CommentWithReactions {
    replies: CommentWithReactions[];
}

async function attachReactions(
    commentRows: CommentRow[],
    currentUserId: string | null
): Promise<CommentWithReactions[]> {
    if (commentRows.length === 0) return [];

    const ids = commentRows.map((c) => c.id);

    // Aggregated counts per comment per emoji
    const reactionCounts = await db
        .select({
            commentId: commentReactions.commentId,
            emoji: commentReactions.emoji,
            count: sql<number>`count(*)::int`,
        })
        .from(commentReactions)
        .where(inArray(commentReactions.commentId, ids))
        .groupBy(commentReactions.commentId, commentReactions.emoji);

    // Build map: commentId -> { emoji: count }
    const reactionsMap = new Map<number, Record<string, number>>();
    for (const row of reactionCounts) {
        if (!reactionsMap.has(row.commentId)) {
            reactionsMap.set(row.commentId, {});
        }
        reactionsMap.get(row.commentId)![row.emoji] = row.count;
    }

    // Current user's reactions
    const userReactionsMap = new Map<number, string>();
    if (currentUserId) {
        const userRows = await db
            .select({
                commentId: commentReactions.commentId,
                emoji: commentReactions.emoji,
            })
            .from(commentReactions)
            .where(
                and(
                    inArray(commentReactions.commentId, ids),
                    eq(commentReactions.userId, currentUserId)
                )
            );
        for (const row of userRows) {
            userReactionsMap.set(row.commentId, row.emoji);
        }
    }

    return commentRows.map((c) => ({
        ...c,
        reactions: reactionsMap.get(c.id) ?? {},
        userReaction: userReactionsMap.get(c.id) ?? null,
    }));
}

function threadComments(parents: CommentWithReactions[], replies: CommentWithReactions[]): ThreadedComment[] {
    const replyMap = new Map<number, CommentWithReactions[]>();
    for (const reply of replies) {
        if (reply.parentId === null) continue;
        const bucket = replyMap.get(reply.parentId) ?? [];
        bucket.push(reply);
        replyMap.set(reply.parentId, bucket);
    }
    return parents.map((parent) => ({
        ...parent,
        replies: (replyMap.get(parent.id) ?? []).sort((a, b) => a.id - b.id),
    }));
}

const commentSelect = {
    id: comments.id,
    userId: comments.userId,
    name: users.name,
    image: users.image,
    nickname: users.nickname,
    customImage: users.customImage,
    hideProfilePicture: users.hideProfilePicture,
    content: comments.content,
    imageUrl: comments.imageUrl,
    parentId: comments.parentId,
    createdAt: comments.createdAt,
};

type RawCommentRow = {
    id: number;
    userId: string;
    name: string | null;
    image: string | null;
    nickname: string | null;
    customImage: string | null;
    hideProfilePicture: boolean | null;
    content: string;
    imageUrl: string | null;
    parentId: number | null;
    createdAt: Date;
};

function toCommentRow(raw: RawCommentRow): CommentRow {
    const { displayName, displayImage } = resolvePublicIdentity({
        name: raw.name,
        image: raw.image,
        nickname: raw.nickname,
        customImage: raw.customImage,
        hideProfilePicture: raw.hideProfilePicture ?? false,
    });
    return {
        id: raw.id,
        userId: raw.userId,
        userName: displayName,
        userImage: displayImage,
        content: raw.content,
        imageUrl: raw.imageUrl,
        parentId: raw.parentId,
        createdAt: raw.createdAt,
    };
}

// GET /api/comments?menuDate=2025-12-30&count=true  (sadece sayı)
// GET /api/comments?menuDate=2025-12-30&limit=20&before=<id>&after=<id>
export async function GET(request: NextRequest) {
    try {
        // IP-based rate limiting for GET requests
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
            || headersList.get("x-real-ip")
            || "anonymous";

        const getRateLimit = await checkRateLimit(ip, {
            prefix: "comments-get",
            maxRequests: GET_RATE_LIMIT,
        });

        if (!getRateLimit.allowed) {
            const waitSeconds = Math.ceil(getRateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla istek gönderdiniz. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const menuDate = searchParams.get("menuDate");
        const countOnly = searchParams.get("count") === "true";
        const limitParam = searchParams.get("limit");
        const beforeId = searchParams.get("before");
        const afterId = searchParams.get("after");

        if (!menuDate || !isValidDateFormat(menuDate)) {
            return NextResponse.json(
                { error: "Geçersiz tarih formatı. YYYY-MM-DD kullanın." },
                { status: 400 }
            );
        }

        // Sadece sayı modu
        if (countOnly) {
            const [{ total }] = await db
                .select({ total: count() })
                .from(comments)
                .where(eq(comments.menuDate, menuDate));
            return NextResponse.json({ count: total });
        }

        const limit = Math.min(parseInt(limitParam || "20", 10) || 20, 50);

        // Get current user for reaction data
        const session = await auth();
        const currentUserId = session?.user?.id ?? null;

        // afterId modunda: polling — o ID'den sonraki tüm yeni yorumlar (flat, parentId dahil)
        if (afterId) {
            const parsedAfterId = parseInt(afterId, 10);
            if (isNaN(parsedAfterId)) {
                return NextResponse.json(
                    { error: "Geçersiz 'after' ID." },
                    { status: 400 }
                );
            }
            const rawRows = await db
                .select(commentSelect)
                .from(comments)
                .leftJoin(users, eq(comments.userId, users.id))
                .where(and(eq(comments.menuDate, menuDate), gt(comments.id, parsedAfterId)))
                .orderBy(asc(comments.id));
            const rows = rawRows.map(toCommentRow);
            const withReactions = await attachReactions(rows, currentUserId);
            return NextResponse.json({ comments: withReactions, hasMore: false });
        }

        // beforeId modunda: daha eski parent yorumlar + onların reply'ları
        if (beforeId) {
            const parsedBeforeId = parseInt(beforeId, 10);
            if (isNaN(parsedBeforeId)) {
                return NextResponse.json(
                    { error: "Geçersiz 'before' ID." },
                    { status: 400 }
                );
            }
            const rawParentRows = await db
                .select(commentSelect)
                .from(comments)
                .leftJoin(users, eq(comments.userId, users.id))
                .where(and(
                    eq(comments.menuDate, menuDate),
                    isNull(comments.parentId),
                    lt(comments.id, parsedBeforeId)
                ))
                .orderBy(desc(comments.id))
                .limit(limit + 1);

            const hasMore = rawParentRows.length > limit;
            const parents = rawParentRows.slice(0, limit).reverse().map(toCommentRow);

            let result: ThreadedComment[] = [];
            if (parents.length > 0) {
                const parentIds = parents.map((p) => p.id);
                const rawReplyRows = await db
                    .select(commentSelect)
                    .from(comments)
                    .leftJoin(users, eq(comments.userId, users.id))
                    .where(and(
                        eq(comments.menuDate, menuDate),
                        inArray(comments.parentId, parentIds)
                    ))
                    .orderBy(asc(comments.id));
                const replyRows = rawReplyRows.map(toCommentRow);
                const allRows = [...parents, ...replyRows];
                const withReactions = await attachReactions(allRows, currentUserId);
                const parentsWithReactions = withReactions.filter((c) => c.parentId === null);
                const repliesWithReactions = withReactions.filter((c) => c.parentId !== null);
                result = threadComments(parentsWithReactions, repliesWithReactions);
            }

            return NextResponse.json({ comments: result, hasMore });
        }

        // Varsayılan: son `limit` parent yorum + onların reply'ları
        const rawParentRows = await db
            .select(commentSelect)
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(and(
                eq(comments.menuDate, menuDate),
                isNull(comments.parentId)
            ))
            .orderBy(desc(comments.id))
            .limit(limit + 1);

        const hasMore = rawParentRows.length > limit;
        const parents = rawParentRows.slice(0, limit).reverse().map(toCommentRow);

        let result: ThreadedComment[] = [];
        if (parents.length > 0) {
            const parentIds = parents.map((p) => p.id);
            const rawReplyRows = await db
                .select(commentSelect)
                .from(comments)
                .leftJoin(users, eq(comments.userId, users.id))
                .where(and(
                    eq(comments.menuDate, menuDate),
                    inArray(comments.parentId, parentIds)
                ))
                .orderBy(asc(comments.id));
            const replyRows = rawReplyRows.map(toCommentRow);
            const allRows = [...parents, ...replyRows];
            const withReactions = await attachReactions(allRows, currentUserId);
            const parentsWithReactions = withReactions.filter((c) => c.parentId === null);
            const repliesWithReactions = withReactions.filter((c) => c.parentId !== null);
            result = threadComments(parentsWithReactions, repliesWithReactions);
        }

        return NextResponse.json({ comments: result, hasMore });
    } catch (error) {
        console.error("Comments GET error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}

// POST /api/comments
// Body: { menuDate: "2025-12-30", content: "Yorum metni", parentId?: number }
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Yorum yapmak için giriş yapmalısınız." },
                { status: 401 }
            );
        }

        // Rate limit by user ID
        const rateLimit = await checkRateLimit(session.user.id, {
            prefix: "comment",
            maxRequests: COMMENT_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                {
                    error: `Çok fazla yorum gönderdiniz. Lütfen ${waitSeconds} saniye bekleyin.`,
                    resetIn: rateLimit.resetIn,
                },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": String(waitSeconds),
                    },
                }
            );
        }

        const body = await request.json();
        const { menuDate, content, imageUrl, parentId, mentionedUserIds } = body;

        if (!menuDate || !isValidDateFormat(menuDate)) {
            return NextResponse.json(
                { error: "Geçersiz tarih formatı." },
                { status: 400 }
            );
        }

        // Only allow comments on today's menu
        if (menuDate !== getTurkeyDate()) {
            return NextResponse.json(
                { error: "Sadece bugünün menüsüne yorum yapabilirsiniz." },
                { status: 403 }
            );
        }

        // Reject imageUrl when photo uploads are disabled
        if (imageUrl && !PHOTO_UPLOAD_ENABLED) {
            return NextResponse.json(
                { error: "Fotoğraf yükleme özelliği şu an devre dışı." },
                { status: 403 }
            );
        }

        // Validate imageUrl if provided
        let validatedImageUrl: string | null = null;
        if (imageUrl && typeof imageUrl === "string") {
            const expectedPrefix = process.env.R2_PUBLIC_URL || "";
            if (!expectedPrefix) {
                return NextResponse.json(
                    { error: "Fotoğraf yükleme yapılandırması eksik." },
                    { status: 500 }
                );
            }
            try {
                const parsedUrl = new URL(imageUrl);
                const expectedOrigin = new URL(expectedPrefix).origin;
                if (parsedUrl.origin !== expectedOrigin || parsedUrl.pathname.includes("..")) {
                    return NextResponse.json(
                        { error: "Geçersiz fotoğraf URL'i." },
                        { status: 400 }
                    );
                }
            } catch {
                return NextResponse.json(
                    { error: "Geçersiz fotoğraf URL'i." },
                    { status: 400 }
                );
            }
            validatedImageUrl = imageUrl;
        }

        // At least content or imageUrl must be provided
        const hasContent = content && typeof content === "string" && content.trim().length > 0;
        if (!hasContent && !validatedImageUrl) {
            return NextResponse.json(
                { error: "Yorum metni veya fotoğraf gereklidir." },
                { status: 400 }
            );
        }

        let sanitizedContent = "";
        if (hasContent) {
            const trimmedContent = content.trim();

            if (trimmedContent.length > MAX_COMMENT_LENGTH) {
                return NextResponse.json(
                    { error: `Yorum en fazla ${MAX_COMMENT_LENGTH} karakter olabilir.` },
                    { status: 400 }
                );
            }

            // XSS defense-in-depth: iteratively strip all HTML tags (handles nested/malformed tags)
            sanitizedContent = sanitizeHtml(trimmedContent);

            // Reject if sanitization removed all content (e.g. pure HTML/XSS payloads)
            if (sanitizedContent.trim().length === 0 && !validatedImageUrl) {
                return NextResponse.json(
                    { error: "Yorum metni geçersiz içerik barındırmaktadır." },
                    { status: 400 }
                );
            }

            // Profanity check
            if (sanitizedContent.trim().length > 0 && containsBadWord(sanitizedContent)) {
                return NextResponse.json(
                    { error: "Yorumunuz uygunsuz içerik barındırmaktadır." },
                    { status: 400 }
                );
            }
        }

        // parentId validasyonu (opsiyonel)
        let resolvedParentId: number | null = null;
        if (parentId !== undefined && parentId !== null) {
            if (typeof parentId !== "number" || !Number.isInteger(parentId) || parentId <= 0) {
                return NextResponse.json(
                    { error: "Geçersiz parentId." },
                    { status: 400 }
                );
            }
            const [parent] = await db
                .select({ id: comments.id, parentId: comments.parentId, menuDate: comments.menuDate })
                .from(comments)
                .where(eq(comments.id, parentId));

            if (!parent) {
                return NextResponse.json(
                    { error: "Yanıt verilen yorum bulunamadı." },
                    { status: 404 }
                );
            }
            if (parent.menuDate !== menuDate) {
                return NextResponse.json(
                    { error: "Geçersiz parentId." },
                    { status: 400 }
                );
            }
            // Flatten: yanıt bir reply'a veriliyorsa üst parent'ı kullan
            resolvedParentId = parent.parentId !== null ? parent.parentId : parent.id;
        }

        const [newComment] = await db
            .insert(comments)
            .values({
                userId: session.user.id,
                menuDate,
                content: sanitizedContent,
                imageUrl: validatedImageUrl,
                parentId: resolvedParentId,
            })
            .returning();

        // Bildirimleri oluştur (fire-and-forget)
        try {
            // Reply bildirimi: parent yorumun sahibine
            let replyRecipientId: string | null = null;
            if (resolvedParentId) {
                const [parentComment] = await db
                    .select({ userId: comments.userId })
                    .from(comments)
                    .where(eq(comments.id, resolvedParentId));
                if (parentComment) {
                    replyRecipientId = parentComment.userId;
                    await createNotification({
                        userId: parentComment.userId,
                        actorId: session.user.id,
                        type: "reply",
                        commentId: newComment.id,
                    });
                }
            }

            // Mention bildirimleri — validate & limit
            if (Array.isArray(mentionedUserIds) && mentionedUserIds.length > 0) {
                const candidateIds = mentionedUserIds
                    .filter((id): id is string => typeof id === "string")
                    .slice(0, 10); // max 10 mention

                if (candidateIds.length > 0) {
                    // Verify mentioned users exist in DB
                    const existingUsers = await db
                        .select({ id: users.id })
                        .from(users)
                        .where(inArray(users.id, candidateIds));
                    const validIds = existingUsers.map((u) => u.id);

                    // Filter out self and reply recipient (prevent duplicate notification)
                    const mentionTargets = validIds.filter(
                        (id) => id !== session.user.id && id !== replyRecipientId
                    );

                    if (mentionTargets.length > 0) {
                        const actorId = session.user.id!;
                        await db.insert(notifications).values(
                            mentionTargets.map((userId) => ({
                                userId,
                                actorId,
                                type: "mention" as const,
                                commentId: newComment.id,
                            }))
                        );
                    }
                }
            }
        } catch (notifError) {
            console.error("Notification creation error:", notifError);
        }

        // Return comment with display identity matching what GET returns,
        // so the optimistic insert is consistent with the public feed view
        // (e.g. hideProfilePicture also blanks the avatar on the user's own comments).
        const { displayName, displayImage } = resolvePublicIdentity({
            name: session.user.name ?? null,
            image: session.user.image ?? null,
            nickname: session.user.nickname ?? null,
            customImage: session.user.customImage ?? null,
            hideProfilePicture: session.user.hideProfilePicture ?? false,
        });

        return NextResponse.json(
            {
                comment: {
                    id: newComment.id,
                    userId: session.user.id,
                    userName: displayName,
                    userImage: displayImage,
                    content: newComment.content,
                    imageUrl: newComment.imageUrl,
                    parentId: newComment.parentId,
                    createdAt: newComment.createdAt,
                },
            },
            {
                status: 201,
                headers: {
                    "X-RateLimit-Remaining": String(rateLimit.remaining),
                },
            }
        );
    } catch (error) {
        console.error("Comments POST error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}
