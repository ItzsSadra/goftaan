import { NextResponse, type NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

const COOKIE_NAME = "goftaan-token"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value

  let userId: string | null = null
  if (token) {
    const payload = await verifyToken(token)
    userId = payload?.userId || null
  }

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup")

  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth")

  const isPublicRoute = isAuthPage || isApiAuthRoute

  if (!userId && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (userId && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/meetings"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)",
  ],
}
