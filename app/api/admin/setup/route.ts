import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await prisma.$executeRawUnsafe(
    "UPDATE Admin SET setupCompleted = 1 WHERE id = ?",
    admin.id
  )

  return NextResponse.json({ ok: true })
}
