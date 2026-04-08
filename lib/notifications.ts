import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { and, eq, gt } from "drizzle-orm"

export async function createNotification(params: {
    userId: string
    actorId: string
    type: "mention" | "reaction" | "reply"
    commentId: number
}): Promise<void> {
    // Kendi kendine bildirim gönderme
    if (params.userId === params.actorId) return

    // Aynı kullanıcıdan aynı yoruma aynı tipte son 5 dakikada bildirim varsa tekrar oluşturma
    if (params.type === "reaction") {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
        const [existing] = await db
            .select({ id: notifications.id })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, params.userId),
                    eq(notifications.actorId, params.actorId),
                    eq(notifications.type, params.type),
                    eq(notifications.commentId, params.commentId),
                    gt(notifications.createdAt, fiveMinAgo)
                )
            )
            .limit(1)
        if (existing) return
    }

    await db.insert(notifications).values({
        userId: params.userId,
        actorId: params.actorId,
        type: params.type,
        commentId: params.commentId,
    })
}
