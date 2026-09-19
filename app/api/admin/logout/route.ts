import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/admin-auth"
import { getAdminFromRequest } from "@/lib/admin-api"
import { createAdminLog } from "@/lib/admin-log"

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" })
  if (admin) {
    await createAdminLog({
      adminId: admin.id,
      action: "admin.logout",
      details: {},
      request,
    })
  }
  return res
}
