import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL, assertR2Config } from "@/lib/r2";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { PHOTO_UPLOAD_ENABLED } from "@/lib/feature-flags";
import { db } from "@/lib/db/index";
import { comments } from "@/lib/db/schema";
import { eq, and, isNotNull, gte, count } from "drizzle-orm";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const DAILY_PHOTO_LIMIT = 3;
const UPLOAD_RATE_LIMIT = 3; // 3 requests per minute

// POST /api/photos/upload — Server-side upload to R2
export async function POST(request: NextRequest) {
    try {
        if (!PHOTO_UPLOAD_ENABLED) {
            return NextResponse.json(
                { error: "Fotoğraf yükleme özelliği şu an devre dışı." },
                { status: 403 }
            );
        }

        try {
            assertR2Config();
        } catch (e) {
            console.error("[photo-upload] R2 config error:", e);
            return NextResponse.json(
                { error: "Fotoğraf yükleme yapılandırması eksik." },
                { status: 503 }
            );
        }

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Fotoğraf yüklemek için giriş yapmalısınız." },
                { status: 401 }
            );
        }

        // Burst rate limit
        const rateLimit = await checkRateLimit(session.user.id, {
            prefix: "photo-upload",
            maxRequests: UPLOAD_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla yükleme isteği. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
            );
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Dosya bulunamadı." },
                { status: 400 }
            );
        }

        // Validate file type (client-declared)
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Geçersiz dosya türü. Sadece JPEG, PNG ve WebP desteklenir." },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "Dosya boyutu en fazla 25MB olabilir." },
                { status: 400 }
            );
        }

        // Magic bytes validation — verify actual file content matches declared MIME type
        const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
        const isJpeg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
        const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
        const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46
            && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

        // Ensure magic bytes match declared MIME type (prevent type confusion)
        const mimeMatchesMagic =
            (file.type === "image/jpeg" && isJpeg) ||
            (file.type === "image/png" && isPng) ||
            (file.type === "image/webp" && isWebp);

        if (!mimeMatchesMagic) {
            return NextResponse.json(
                { error: "Dosya içeriği ile dosya türü uyuşmuyor. Sadece gerçek resim dosyaları kabul edilir." },
                { status: 400 }
            );
        }

        // Daily photo limit — Türkiye 2016'dan beri kalıcı UTC+3 (DST yok)
        // toLocaleString tabanlı timezone parse yerine saf UTC aritmetiği kullanılır.
        const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;
        const nowInTurkey = new Date(Date.now() + TURKEY_OFFSET_MS);
        const today = new Date(Date.UTC(
            nowInTurkey.getUTCFullYear(),
            nowInTurkey.getUTCMonth(),
            nowInTurkey.getUTCDate()
        ));

        const [{ total }] = await db
            .select({ total: count() })
            .from(comments)
            .where(
                and(
                    eq(comments.userId, session.user.id),
                    isNotNull(comments.imageUrl),
                    gte(comments.createdAt, today)
                )
            );

        if (total >= DAILY_PHOTO_LIMIT) {
            return NextResponse.json(
                { error: `Günlük fotoğraf limitine ulaştınız (${DAILY_PHOTO_LIMIT} fotoğraf/gün).` },
                { status: 429 }
            );
        }

        // Generate unique key
        const uuid = crypto.randomUUID();
        const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
        const key = `comments/${session.user.id}/${uuid}.${ext}`;

        // Upload directly to R2 from server
        const buffer = await file.arrayBuffer();
        await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: Buffer.from(buffer),
            ContentType: file.type,
        }));

        const publicUrl = `${R2_PUBLIC_URL}/${key}`;
        return NextResponse.json({ publicUrl });
    } catch (error) {
        console.error("Photo upload error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}
