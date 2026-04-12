import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications, users, comments } from "@/lib/db/schema"
import { eq, desc, and, sql, inArray } from "drizzle-orm"
import { checkRateLimit } from "@/lib/rate-limiter"
import { resolvePublicIdentity } from "@/lib/user-identity"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 })
    }

    const { allowed } = await checkRateLimit(session.user.id, {
        prefix: "notif-list",
        maxRequests: 20,
    })
    if (!allowed) {
        return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 })
    }

    const limitParam = req.nextUrl.searchParams.get("limit")
    const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 50)

    const rawRows = await db
        .select({
            id: notifications.id,
            type: notifications.type,
            read: notifications.read,
            createdAt: notifications.createdAt,
            commentId: notifications.commentId,
            actorName: users.name,
            actorImage: users.image,
            actorNickname: users.nickname,
            actorCustomImage: users.customImage,
            actorHideProfilePicture: users.hideProfilePicture,
            commentContent: comments.content,
            menuDate: comments.menuDate,
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.actorId, users.id))
        .leftJoin(comments, eq(notifications.commentId, comments.id))
        .where(eq(notifications.userId, session.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)

    const rows = rawRows.map(({ actorNickname, actorCustomImage, actorHideProfilePicture, ...rest }) => {
        const { displayName, displayImage } = resolvePublicIdentity({
            name: rest.actorName,
            image: rest.actorImage,
            nickname: actorNickname,
            customImage: actorCustomImage,
            hideProfilePicture: actorHideProfilePicture ?? false,
        })
        return {
            ...rest,
            actorName: displayName,
            actorImage: displayImage,
        }
    })

    const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)))

    return NextResponse.json({
        notifications: rows,
        unreadCount: countResult?.count ?? 0,
    })
}

export async function PATCH(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 })
    }

    const { allowed } = await checkRateLimit(session.user.id, {
        prefix: "notif-patch",
        maxRequests: 20,
    })
    if (!allowed) {
        return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 })
    }

    const body = await req.json()

    if (body.markAllRead) {
        await db
            .update(notifications)
            .set({ read: true })
            .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)))
    } else if (Array.isArray(body.notificationIds) && body.notificationIds.length > 0) {
        // Validate: must be numbers and max 50 at a time
        const ids = body.notificationIds
            .filter((id: unknown): id is number => typeof id === "number" && Number.isInteger(id))
            .slice(0, 50)
        if (ids.length > 0) {
            await db
                .update(notifications)
                .set({ read: true })
                .where(
                    and(
                        eq(notifications.userId, session.user.id),
                        inArray(notifications.id, ids)
                    )
                )
        }
    }

    return NextResponse.json({ success: true })
}
