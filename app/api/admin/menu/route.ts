import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { createAdminLog } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { order: "asc" },
    })
    return NextResponse.json(items)
  } catch (e) {
    console.error("[admin:menu] Erro ao listar itens de menu", e)
    return NextResponse.json({ error: "Erro ao listar menu" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const body = await request.json()
    const items = (body.items ?? []) as any[]

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items deve ser um array" }, { status: 400 })
    }

    const existing = await prisma.menuItem.findMany()
    const existingIds = new Set(existing.map((i) => i.id))
    const incomingIds = new Set<string>()

    const operations = []

    for (const raw of items) {
      if (!raw) continue
      const id: string | undefined = raw.id
      const clean = {
        label: String(raw.label ?? "").trim() || "Item",
        slugOrUrl: String(raw.slugOrUrl ?? "").trim() || "/",
        position: String(raw.position ?? "header"),
        order: Number.isFinite(raw.order) ? Number(raw.order) : 0,
        visible: Boolean(raw.visible ?? true),
        targetType: String(raw.targetType ?? "url"),
        categoryId: raw.categoryId ?? null,
      }

      if (id && existingIds.has(id)) {
        incomingIds.add(id)
        operations.push(
          prisma.menuItem.update({
            where: { id },
            data: clean,
          }),
        )
      } else {
        const created = prisma.menuItem.create({
          data: clean,
        })
        operations.push(created)
      }
    }

    const toDelete = existing.filter((i) => !incomingIds.has(i.id))
    for (const item of toDelete) {
      operations.push(prisma.menuItem.delete({ where: { id: item.id } }))
    }

    await prisma.$transaction(operations)

    const saved = await prisma.menuItem.findMany({ orderBy: { order: "asc" } })

    await createAdminLog({
      adminId: admin.id,
      action: "menu.update",
      details: {
        count: saved.length,
      },
      request,
    })

    return NextResponse.json({ items: saved })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao salvar menu" }, { status: 500 })
  }
}

