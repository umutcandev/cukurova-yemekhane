import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// AUTH_ENABLED kontrolü — build-time'da sabitlenir
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false"

// Protected routes that require authentication
const protectedRoutes = ["/favorilerim", "/kalori-takibi"]

export default async function middleware(req: NextRequest) {
    // Auth kapalıysa middleware hiçbir şey yapmaz — edge request minimuma iner
    if (!AUTH_ENABLED) {
        return NextResponse.next()
    }

    // Auth açıkken dinamik import ile auth fonksiyonunu yükle
    const { auth } = await import("@/lib/auth")
    const session = await auth()

    const { pathname } = req.nextUrl
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

    if (isProtected && !session) {
        const url = req.nextUrl.clone()
        url.pathname = "/"
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const runtime = "nodejs"

export const config = {
    /*
     * Middleware sadece korunan sayfalarda çalışır.
     * Statik dosyalar, next internal route'lar ve API route'ları hariç tutulur.
     * Bu sayede gereksiz Edge Runtime invocation'ları önlenir.
     */
    matcher: [
        "/favorilerim",
        "/favorilerim/:path+",
        "/kalori-takibi",
        "/kalori-takibi/:path+",
    ],
}

