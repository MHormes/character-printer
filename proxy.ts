import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // /login — authenticated users go straight to characters
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/characters", request.url))
  }

  // /setup — admins pass through; non-admins with a session are blocked;
  // unauthenticated users pass through only in bootstrap mode (no real users yet),
  // which the server action and page component enforce themselves.
  if (pathname === "/setup") {
    if (token && token.role !== "admin") {
      return NextResponse.redirect(new URL("/characters", request.url))
    }
    return NextResponse.next()
  }

  // Protected app routes — require any valid session
  const isProtected = pathname.startsWith("/characters") || pathname.startsWith("/forge") || pathname.startsWith("/canvas")
  if (!token && isProtected) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ["/characters/:path*", "/forge/:path*", "/canvas/:path*", "/login", "/setup"],
}
