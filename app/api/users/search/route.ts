import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { ilike } from "drizzle-orm"
import { checkRateLimit } from "@/lib/rate-limiter"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 })
    }

    const { allowed } = await checkRateLimit(session.user.id, {
        prefix: "user-search",
        maxRequests: 10,
    })
    if (!allowed) {
        return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 })
    }

    const q = req.nextUrl.searchParams.get("q")?.trim()
    if (!q || q.length < 3) {
        return NextResponse.json({ users: [] })
    }

    // Escape LIKE wildcard characters to prevent pattern abuse
    const sanitized = q.replace(/[%_\\]/g, "\\$&")

    const results = await db
        .select({ id: users.id, name: users.name, image: users.image })
        .from(users)
        .where(ilike(users.name, `%${sanitized}%`))
        .limit(5)

    return NextResponse.json({ users: results })
}
