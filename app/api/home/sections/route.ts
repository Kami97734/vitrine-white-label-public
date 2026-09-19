import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { createAdminLog } from "@/lib/admin-log"

export async function GET() {
  const rows = await prisma.homeSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  })
  return NextResponse.json(rows)
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const body = await request.json()
    const sections = Array.isArray(body?.sections) ? body.sections : []

    await prisma.$transaction([
      prisma.homeSection.deleteMany(),
      ...sections.map((raw: any, idx: number) =>
        prisma.homeSection.create({
          data: {
            key: String(raw.key ?? `section_${idx + 1}`).trim(),
            type: String(raw.type ?? "text").trim(),
            value: String(raw.value ?? "").trim(),
            sortOrder: Number.isFinite(raw.sortOrder) ? Number(raw.sortOrder) : idx,
          },
        })
      ),
    ])

    const saved = await prisma.homeSection.findMany({ orderBy: { sortOrder: "asc" } })
    await createAdminLog({
      adminId: admin.id,
      action: "home.sections.update",
      entityType: "homeSection",
      result: "success",
      details: { count: saved.length },
      request,
    })

    return NextResponse.json(saved)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao salvar seções" }, { status: 500 })
  }
}
