import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authMiddleware } from "@/lib/auth.config"

export default authMiddleware((req) => {
    const { pathname } = req.nextUrl
    const isLoggedIn = !!req.auth
    const userRole = req.auth?.user?.role

    // Public routes
    const publicRoutes = ["/login", "/register", "/"]
    const isPublicRoute = publicRoutes.includes(pathname)

    // API routes are handled separately
    if (pathname.startsWith("/api")) {
        return NextResponse.next()
    }

    // Redirect logged-in users away from auth pages
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        const redirectUrl = userRole === "COUNSELOR" ? "/counselor" : "/individual"
        return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // Protect dashboard routes
    if (!isLoggedIn && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // Role-based access control
    if (isLoggedIn) {
        if (pathname.startsWith("/counselor") && userRole !== "COUNSELOR") {
            return NextResponse.redirect(new URL("/individual", req.url))
        }
        if (pathname.startsWith("/individual") && userRole !== "INDIVIDUAL") {
            return NextResponse.redirect(new URL("/counselor", req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
