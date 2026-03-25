import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { comments, commentReports, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { sendReportNotification } from "@/lib/mail";

const REPORT_RATE_LIMIT = 3; // 3 reports per minute

// POST /api/comments/report
// Body: { commentId: 1, reason: "Hakaret içeriyor" }
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Raporlamak için giriş yapmalısınız." },
                { status: 401 }
            );
        }

        // Rate limit by user ID
        const rateLimit = await checkRateLimit(session.user.id, {
            prefix: "report",
            maxRequests: REPORT_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                {
                    error: `Çok fazla rapor gönderdiniz. Lütfen ${waitSeconds} saniye bekleyin.`,
                    resetIn: rateLimit.resetIn,
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { commentId, reason } = body;

        if (!commentId || typeof commentId !== "number") {
            return NextResponse.json(
                { error: "Geçersiz yorum ID." },
                { status: 400 }
            );
        }

        if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
            return NextResponse.json(
                { error: "Rapor sebebi gereklidir." },
                { status: 400 }
            );
        }

        // Fetch the comment with author info
        const [comment] = await db
            .select({
                id: comments.id,
                userId: comments.userId,
                content: comments.content,
                menuDate: comments.menuDate,
                authorName: users.name,
            })
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(eq(comments.id, commentId));

        if (!comment) {
            return NextResponse.json(
                { error: "Yorum bulunamadı." },
                { status: 404 }
            );
        }

        // Prevent self-reporting
        if (comment.userId === session.user.id) {
            return NextResponse.json(
                { error: "Kendi yorumunuzu raporlayamazsınız." },
                { status: 400 }
            );
        }

        // Insert the report (unique constraint handles duplicates)
        try {
            await db.insert(commentReports).values({
                commentId,
                reporterId: session.user.id,
                reason: reason.trim(),
            });
        } catch (err: unknown) {
            // Drizzle wraps the pg error inside err.cause — check both
            const isUniqueViolation = (e: unknown): boolean => {
                if (!e || typeof e !== "object") return false;
                if ("code" in e && (e as { code: string }).code === "23505") return true;
                if ("cause" in e) return isUniqueViolation((e as { cause: unknown }).cause);
                return false;
            };
            if (isUniqueViolation(err)) {
                return NextResponse.json(
                    { error: "Bu yorumu zaten raporladınız." },
                    { status: 409 }
                );
            }
            throw err;
        }

        // Send email notification to moderator (async, don't block response)
        sendReportNotification({
            reporterName: session.user.name || "Bilinmeyen",
            reporterEmail: session.user.email || "Bilinmeyen",
            commentAuthorName: comment.authorName || "Bilinmeyen",
            commentContent: comment.content,
            reportReason: reason.trim(),
            menuDate: comment.menuDate,
            commentId: comment.id,
        }).catch((err) => {
            console.error("Failed to send report notification:", err);
        });

        return NextResponse.json({ success: true, message: "Rapor başarıyla gönderildi." });
    } catch (error) {
        console.error("Comment report error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
