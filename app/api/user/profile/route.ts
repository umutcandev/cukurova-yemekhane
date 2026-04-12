import { NextRequest, NextResponse } from "next/server";
import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { containsBadWord } from "@/lib/wordlist";
import { PROFILE_CUSTOMIZATION_ENABLED } from "@/lib/feature-flags";
import { sanitizeHtml } from "@/lib/sanitize";

const PROFILE_RATE_LIMIT = 10;
const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 24;
const NICKNAME_REGEX = /^[\p{L}\p{N}_.\-]+(?: [\p{L}\p{N}_.\-]+)*$/u;


export async function GET() {
    try {
        if (!PROFILE_CUSTOMIZATION_ENABLED) {
            return NextResponse.json(
                { error: "Profil özelleştirme özelliği şu an devre dışı." },
                { status: 403 }
            );
        }

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Bu işlem için giriş yapmalısınız." },
                { status: 401 }
            );
        }

        const [row] = await db
            .select({
                name: users.name,
                image: users.image,
                nickname: users.nickname,
                customImage: users.customImage,
                hideProfilePicture: users.hideProfilePicture,
            })
            .from(users)
            .where(eq(users.id, session.user.id));

        return NextResponse.json({
            name: row?.name ?? null,
            image: row?.image ?? null,
            nickname: row?.nickname ?? null,
            customImage: row?.customImage ?? null,
            hideProfilePicture: row?.hideProfilePicture ?? false,
        });
    } catch (error) {
        console.error("[user/profile GET] error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        if (!PROFILE_CUSTOMIZATION_ENABLED) {
            return NextResponse.json(
                { error: "Profil özelleştirme özelliği şu an devre dışı." },
                { status: 403 }
            );
        }

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Bu işlem için giriş yapmalısınız." },
                { status: 401 }
            );
        }

        const rateLimit = await checkRateLimit(session.user.id, {
            prefix: "user-profile",
            maxRequests: PROFILE_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla istek. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const updates: { nickname?: string | null; hideProfilePicture?: boolean } = {};

        if ("nickname" in body) {
            const raw = body.nickname;
            if (raw === null) {
                updates.nickname = null;
            } else if (typeof raw === "string") {
                const trimmed = raw.trim();
                if (trimmed.length === 0) {
                    updates.nickname = null;
                } else {
                    const sanitized = sanitizeHtml(trimmed);
                    if (sanitized.length < NICKNAME_MIN_LENGTH || sanitized.length > NICKNAME_MAX_LENGTH) {
                        return NextResponse.json(
                            { error: "Takma ad 2-24 karakter arasında olmalıdır." },
                            { status: 400 }
                        );
                    }
                    if (!NICKNAME_REGEX.test(sanitized)) {
                        return NextResponse.json(
                            { error: "Takma ad sadece harf, rakam ve _ . - karakterlerini içerebilir." },
                            { status: 400 }
                        );
                    }
                    if (containsBadWord(sanitized)) {
                        return NextResponse.json(
                            { error: "Takma ad uygunsuz içerik barındırmaktadır." },
                            { status: 400 }
                        );
                    }

                    const collision = await db
                        .select({ id: users.id })
                        .from(users)
                        .where(
                            and(
                                sql`lower(${users.nickname}) = lower(${sanitized})`,
                                ne(users.id, session.user.id)
                            )
                        )
                        .limit(1);

                    if (collision.length > 0) {
                        return NextResponse.json(
                            { error: "Bu takma ad zaten kullanımda." },
                            { status: 409 }
                        );
                    }

                    updates.nickname = sanitized;
                }
            } else {
                return NextResponse.json(
                    { error: "Geçersiz takma ad değeri." },
                    { status: 400 }
                );
            }
        }

        if ("hideProfilePicture" in body) {
            if (typeof body.hideProfilePicture !== "boolean") {
                return NextResponse.json(
                    { error: "Geçersiz gizlilik ayarı değeri." },
                    { status: 400 }
                );
            }
            updates.hideProfilePicture = body.hideProfilePicture;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "Güncellenecek alan belirtilmedi." },
                { status: 400 }
            );
        }

        try {
            await db.update(users).set(updates).where(eq(users.id, session.user.id));
        } catch (dbError: any) {
            if (dbError.code === "23505") {
                return NextResponse.json(
                    { error: "Bu takma ad zaten kullanımda." },
                    { status: 409 }
                );
            }
            throw dbError;
        }

        const [row] = await db
            .select({
                nickname: users.nickname,
                hideProfilePicture: users.hideProfilePicture,
            })
            .from(users)
            .where(eq(users.id, session.user.id));

        return NextResponse.json({
            success: true,
            profile: {
                nickname: row?.nickname ?? null,
                hideProfilePicture: row?.hideProfilePicture ?? false,
            },
        });
    } catch (error) {
        console.error("[user/profile PATCH] error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}
