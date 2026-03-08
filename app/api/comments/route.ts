import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db/index";
import { comments, users } from "@/lib/db/schema";
import { eq, asc, desc, gt, lt, and, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { checkRateLimit, isValidDateFormat } from "@/lib/rate-limiter";
import { containsBadWord } from "@/lib/wordlist";

const MAX_COMMENT_LENGTH = 200;
const COMMENT_RATE_LIMIT = 5; // 5 comments per minute
const GET_RATE_LIMIT = 30; // 30 requests per minute for GET

/**
 * Robust HTML sanitizer — iteratively strips all HTML tags
 * to prevent bypass via nested/malformed tags like <scr<script>ipt>.
 */
function sanitizeHtml(input: string): string {
    let result = input;
    let prev = "";
    // Iteratively strip until no more tags remain
    while (result !== prev) {
        prev = result;
        result = result.replace(/<[^>]*>?/g, "");
    }
    // Also strip any remaining event-handler-like patterns
    result = result.replace(/on\w+\s*=/gi, "");
    return result;
}

const commentSelect = {
    id: comments.id,
    userId: comments.userId,
    userName: users.name,
    userImage: users.image,
    content: comments.content,
    createdAt: comments.createdAt,
};

// GET /api/comments?menuDate=2025-12-30&count=true  (sadece sayı)
// GET /api/comments?menuDate=2025-12-30&limit=20&before=<id>&after=<id>
export async function GET(request: NextRequest) {
    try {
        // IP-based rate limiting for GET requests
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
            || headersList.get("x-real-ip")
            || "anonymous";

        const getRateLimit = checkRateLimit(ip, {
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
                { error: "Invalid date format. Use YYYY-MM-DD" },
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

        // afterId modunda: polling — o ID'den sonraki tüm yeni yorumlar
        if (afterId) {
            const parsedAfterId = parseInt(afterId, 10);
            if (isNaN(parsedAfterId)) {
                return NextResponse.json(
                    { error: "Geçersiz 'after' ID." },
                    { status: 400 }
                );
            }
            const rows = await db
                .select(commentSelect)
                .from(comments)
                .leftJoin(users, eq(comments.userId, users.id))
                .where(and(eq(comments.menuDate, menuDate), gt(comments.id, parsedAfterId)))
                .orderBy(asc(comments.id));
            return NextResponse.json({ comments: rows, hasMore: false });
        }

        // beforeId modunda: daha eski yorumlar
        if (beforeId) {
            const parsedBeforeId = parseInt(beforeId, 10);
            if (isNaN(parsedBeforeId)) {
                return NextResponse.json(
                    { error: "Geçersiz 'before' ID." },
                    { status: 400 }
                );
            }
            const rows = await db
                .select(commentSelect)
                .from(comments)
                .leftJoin(users, eq(comments.userId, users.id))
                .where(and(eq(comments.menuDate, menuDate), lt(comments.id, parsedBeforeId)))
                .orderBy(desc(comments.id))
                .limit(limit + 1);

            const hasMore = rows.length > limit;
            const result = rows.slice(0, limit).reverse(); // kronolojik sıra
            return NextResponse.json({ comments: result, hasMore });
        }

        // Varsayılan: son `limit` yorum (en yeniden geriye doğru)
        const rows = await db
            .select(commentSelect)
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(eq(comments.menuDate, menuDate))
            .orderBy(desc(comments.id))
            .limit(limit + 1); // +1 ile hasMore tespiti

        const hasMore = rows.length > limit;
        const result = rows.slice(0, limit).reverse(); // kronolojik sıra

        return NextResponse.json({ comments: result, hasMore });
    } catch (error) {
        console.error("Comments GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/comments
// Body: { menuDate: "2025-12-30", content: "Yorum metni" }
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
        const rateLimit = checkRateLimit(session.user.id, {
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
        const { menuDate, content } = body;

        if (!menuDate || !isValidDateFormat(menuDate)) {
            return NextResponse.json(
                { error: "Geçersiz tarih formatı." },
                { status: 400 }
            );
        }

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Yorum metni gereklidir." },
                { status: 400 }
            );
        }

        const trimmedContent = content.trim();

        if (trimmedContent.length === 0) {
            return NextResponse.json(
                { error: "Yorum metni boş olamaz." },
                { status: 400 }
            );
        }

        if (trimmedContent.length > MAX_COMMENT_LENGTH) {
            return NextResponse.json(
                { error: `Yorum en fazla ${MAX_COMMENT_LENGTH} karakter olabilir.` },
                { status: 400 }
            );
        }

        // XSS defense-in-depth: iteratively strip all HTML tags (handles nested/malformed tags)
        const sanitizedContent = sanitizeHtml(trimmedContent);

        // Reject if sanitization removed all content (e.g. pure HTML/XSS payloads)
        if (sanitizedContent.trim().length === 0) {
            return NextResponse.json(
                { error: "Yorum metni geçersiz içerik barındırmaktadır." },
                { status: 400 }
            );
        }

        // Profanity check
        if (containsBadWord(sanitizedContent)) {
            return NextResponse.json(
                { error: "Yorumunuz uygunsuz içerik barındırmaktadır." },
                { status: 400 }
            );
        }

        const [newComment] = await db
            .insert(comments)
            .values({
                userId: session.user.id,
                menuDate,
                content: sanitizedContent,
            })
            .returning();

        // Return comment with user info
        return NextResponse.json(
            {
                comment: {
                    id: newComment.id,
                    userId: session.user.id,
                    userName: session.user.name,
                    userImage: session.user.image,
                    content: newComment.content,
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
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
