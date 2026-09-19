import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const { code } = await params
    const body = await request.json()
    const value = typeof body.value === "number" ? body.value : parseFloat(body.value)

    if (Number.isNaN(value) || value < 0) {
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 })
    }

    const product = code
      ? await prisma.product.findUnique({ where: { code } })
      : null

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    await prisma.price.create({
      data: { productId: product.id, value },
    })

    return NextResponse.json({ ok: true, productId: product.id, value })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao atualizar preço" }, { status: 500 })
  }
}
