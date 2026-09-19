import { NextRequest } from "next/server"
import { getAdminTokenFromCookie, verifyAdminToken } from "./admin-auth"
import { prisma } from "./prisma"

export async function getAdminFromRequest(request: NextRequest): Promise<{ id: string } | null> {
  const token = getAdminTokenFromCookie(request.headers.get("cookie"))
  if (!token) return null
  const payload = await verifyAdminToken(token)
  if (!payload) return null
  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
  })
  return admin ? { id: admin.id } : null
}

export async function requireAdmin(request: NextRequest): Promise<{ id: string }> {
  const admin = await getAdminFromRequest(request)
  if (!admin) throw new Error("Unauthorized")
  return admin
}
