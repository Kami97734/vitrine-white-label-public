import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET() {
  const rows = await prisma.homeContent.findMany()
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return NextResponse.json(map)
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const body = (await request.json()) as Record<string, string>
    for (const [key, value] of Object.entries(body)) {
      if (typeof key !== "string" || typeof value !== "string") continue
      await prisma.homeContent.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    }
    const rows = await prisma.homeContent.findMany()
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value

    console.log("[admin:audit] Home content atualizado", {
      adminId: admin.id,
      keys: Object.keys(body),
    })

    return NextResponse.json(map)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 })
  }
}
