import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET() {
  const data = await prisma.$queryRawUnsafe<any[]>(
    "SELECT * FROM Coupon ORDER BY createdAt DESC"
  )
  return NextResponse.json(data.map((r: any) => ({ ...r, id: String(r.id) })))
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const body = await request.json()
    const code = String(body.code).trim().toUpperCase()

    const existing = await prisma.$queryRawUnsafe<any[]>(
    "SELECT id FROM Coupon WHERE code = ?", code)
    if (existing.length > 0) return NextResponse.json({ error: "Código já existe" }, { status: 400 })

    await prisma.$executeRawUnsafe(
      "INSERT INTO Coupon (id, code, discount, minValue, maxUses, usedCount, active, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, 1, ?, datetime('now'), datetime('now'))",
      crypto.randomUUID(),
      code,
      Number(body.discount),
      Number(body.minValue ?? 0),
      Number(body.maxUses ?? 0),
      body.expiresAt ? new Date(body.expiresAt).toISOString() : null
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const body = await request.json()
    await prisma.$executeRawUnsafe(
      "UPDATE Coupon SET code = ?, discount = ?, minValue = ?, maxUses = ?, active = ?, expiresAt = ?, updatedAt = datetime('now') WHERE id = ?",
      String(body.code).trim().toUpperCase(),
      Number(body.discount),
      Number(body.minValue ?? 0),
      Number(body.maxUses ?? 0),
      body.active ? 1 : 0,
      body.expiresAt ? new Date(body.expiresAt).toISOString() : null,
      body.id
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar cupom" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })

  await prisma.$executeRawUnsafe("DELETE FROM Coupon WHERE id = ?", id)
  return NextResponse.json({ ok: true })
}
