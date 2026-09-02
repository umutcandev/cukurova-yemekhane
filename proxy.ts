import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const protectedRoutes = ["/favorilerim", "/kalori-takibi"]

export default async function proxy(req: NextRequest) {
    // auth yalnızca eşleşen route'larda yüklensin diye dinamik import
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

