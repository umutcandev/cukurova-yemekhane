import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Protected routes that require authentication
const protectedRoutes = ["/favorilerim", "/kalori-takibi"]

export default auth((req) => {
    const { pathname } = req.nextUrl

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

    if (isProtected && !req.auth) {
        const url = req.nextUrl.clone()
        url.pathname = "/"
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
})

export const config = {
    /*
     * Middleware sadece korunan sayfalarda çalışır.
     * Statik dosyalar, next internal route'lar, PWA servis worker,
     * workbox cache dosyaları ve API route'ları hariç tutulur.
     * Bu sayede gereksiz Edge Runtime invocation'ları önlenir.
     */
    matcher: [
        "/favorilerim",
        "/favorilerim/:path+",
        "/kalori-takibi",
        "/kalori-takibi/:path+",
    ],
}
