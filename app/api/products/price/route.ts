import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function PATCH(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const body = await request.json()
    const { code, price } = body
    if (!code || typeof code !== "string" || code.trim() === "") {
      return NextResponse.json({ error: "Código do produto é obrigatório" }, { status: 400 })
    }
    const numPrice = typeof price === "number" ? price : parseFloat(price)
    if (Number.isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { code: code.trim() },
      include: { prices: { orderBy: { effectiveAt: "desc" }, take: 1 } },
    })
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado com este código" }, { status: 404 })
    }

    const oldValue = product.prices[0]?.value
    await prisma.price.create({
      data: {
        productId: product.id,
        value: numPrice,
        oldValue: oldValue != null && oldValue !== numPrice ? oldValue : undefined,
      },
    })

    console.log("[admin:audit] Preço atualizado", {
      adminId: admin.id,
      productId: product.id,
      code: product.code,
      newPrice: numPrice,
      oldPrice: oldValue,
    })

    return NextResponse.json({ ok: true, productId: product.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao atualizar preço" }, { status: 500 })
  }
}
