import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import {
    r2Client,
    R2_BUCKET,
    R2_PUBLIC_URL,
    assertR2Config,
    deleteR2ObjectFromPublicUrl,
} from "@/lib/r2";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { PROFILE_CUSTOMIZATION_ENABLED } from "@/lib/feature-flags";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_RATE_LIMIT = 3;
const DELETE_RATE_LIMIT = 5;

export async function POST(request: NextRequest) {
    try {
        if (!PROFILE_CUSTOMIZATION_ENABLED) {
            return NextResponse.json(
                { error: "Profil özelleştirme özelliği şu an devre dışı." },
                { status: 403 }
            );
        }

        try {
            assertR2Config();
        } catch (e) {
            console.error("[avatar-upload] R2 config error:", e);
            return NextResponse.json(
                { error: "Fotoğraf yükleme yapılandırması eksik." },
                { status: 503 }
            );
        }

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Profil fotoğrafı yüklemek için giriş yapmalısınız." },
                { status: 401 }
            );
        }

        const rateLimit = await checkRateLimit(session.user.id, {
            prefix: "avatar-upload",
            maxRequests: UPLOAD_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla yükleme isteği. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Geçersiz dosya türü. Sadece JPEG, PNG ve WebP desteklenir." },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "Dosya boyutu en fazla 10MB olabilir." },
                { status: 400 }
            );
        }

        const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
        const isJpeg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
        const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
        const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46
            && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

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

        const [existing] = await db
            .select({ customImage: users.customImage })
            .from(users)
            .where(eq(users.id, session.user.id));

        if (existing?.customImage) {
            await deleteR2ObjectFromPublicUrl(existing.customImage);
        }

        const uuid = crypto.randomUUID();
        const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
        const key = `avatars/${session.user.id}/${uuid}.${ext}`;

        const buffer = await file.arrayBuffer();
        await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: Buffer.from(buffer),
            ContentType: file.type,
        }));

        const publicUrl = `${R2_PUBLIC_URL}/${key}`;

        await db
            .update(users)
            .set({ customImage: publicUrl })
            .where(eq(users.id, session.user.id));

        return NextResponse.json({ publicUrl });
    } catch (error) {
        console.error("[avatar-upload] error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}

export async function DELETE() {
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
            prefix: "avatar-delete",
            maxRequests: DELETE_RATE_LIMIT,
        });

        if (!rateLimit.allowed) {
            const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
            return NextResponse.json(
                { error: `Çok fazla istek. Lütfen ${waitSeconds} saniye bekleyin.` },
                { status: 429 }
            );
        }

        const [existing] = await db
            .select({ customImage: users.customImage })
            .from(users)
            .where(eq(users.id, session.user.id));

        if (existing?.customImage) {
            await deleteR2ObjectFromPublicUrl(existing.customImage);
            await db
                .update(users)
                .set({ customImage: null })
                .where(eq(users.id, session.user.id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[avatar-delete] error:", error);
        return NextResponse.json(
            { error: "Sunucu hatası oluştu." },
            { status: 500 }
        );
    }
}
