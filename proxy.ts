import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAdminTokenFromCookie, verifyAdminToken } from "@/lib/admin-auth"

const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/login/verify",
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin")

  if (!isAdminRoute) return NextResponse.next()

  const isPublic = PUBLIC_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )

  if (pathname === "/admin/login") {
    const token = getAdminTokenFromCookie(request.headers.get("cookie"))
    if (token) {
      const payload = await verifyAdminToken(token)
      if (payload) {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
    }
    return NextResponse.next()
  }

  if (isPublic) return NextResponse.next()

  const token = getAdminTokenFromCookie(request.headers.get("cookie"))

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login como administrador." },
        { status: 401 }
      )
    }
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyAdminToken(token)

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { error: "Sessão expirada. Faça login novamente." },
        { status: 401 }
      )
      res.cookies.delete("admin_token")
      return res
    }
    const res = NextResponse.redirect(new URL("/admin/login", request.url))
    res.cookies.delete("admin_token")
    return res
  }

  const response = NextResponse.next()
  response.headers.set("x-admin-id", payload.adminId)
  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
