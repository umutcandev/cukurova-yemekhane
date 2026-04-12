import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

/**
 * Throws a clear Error if any required R2 env var is missing.
 * Call this at the top of route handlers that use R2 before any SDK call.
 */
export function assertR2Config(): void {
    const missing: string[] = [];
    if (!process.env.R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
    if (!process.env.R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
    if (!process.env.R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
    if (!process.env.R2_BUCKET_NAME) missing.push("R2_BUCKET_NAME");
    if (!process.env.R2_PUBLIC_URL) missing.push("R2_PUBLIC_URL");
    if (missing.length > 0) {
        throw new Error(`R2 yapılandırması eksik: ${missing.join(", ")} ortam değişkenleri gereklidir.`);
    }
}

export async function deleteR2ObjectFromPublicUrl(
    publicUrl: string | null | undefined
): Promise<boolean> {
    if (!publicUrl || !R2_PUBLIC_URL || !publicUrl.startsWith(R2_PUBLIC_URL)) return false;
    try {
        const key = publicUrl.replace(`${R2_PUBLIC_URL}/`, "");
        if (!key || key.includes("..")) return false;
        await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        return true;
    } catch (err) {
        console.error("[r2] delete failed:", publicUrl, err);
        return false;
    }
}
