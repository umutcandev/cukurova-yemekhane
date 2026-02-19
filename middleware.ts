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
    matcher: ["/favorilerim/:path*", "/kalori-takibi/:path*"],
}
