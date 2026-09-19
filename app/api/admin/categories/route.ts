import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const list = await prisma.category.findMany({
    orderBy: { title: "asc" },
    select: { id: true, slug: true, title: true },
  })
  return NextResponse.json(list)
}
