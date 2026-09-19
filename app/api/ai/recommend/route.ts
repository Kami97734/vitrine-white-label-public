import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Recomendação de produtos similares (usado como "IA: recomendados para você").
// Estratégia: mesma categoria + prioriza produtos com descrição e unidade preenchidas.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const productId = typeof body.productId === "string" ? body.productId : null
    const categoryId = typeof body.categoryId === "string" ? body.categoryId : null
    const limit = Math.min(Math.max(parseInt(body.limit ?? "8", 10) || 8, 1), 20)

    if (!productId && !categoryId) {
      return NextResponse.json({ error: "Informe productId ou categoryId" }, { status: 400 })
    }

    const base = productId
      ? await prisma.product.findUnique({ where: { id: productId }, select: { categoryId: true, name: true } })
      : null

    const targetCategoryId = categoryId ?? base?.categoryId ?? null
    if (!targetCategoryId) {
      return NextResponse.json({ products: [] })
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId: targetCategoryId,
        NOT: productId ? { id: productId } : undefined,
      },
      include: {
        category: true,
        prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
      },
      take: limit * 3,
    })

    const scored = products
      .map((p) => {
        let score = 0
        if (p.description && p.description.length >= 50) score += 2
        if (p.unitMeasure && p.unitQuantity) score += 1
        if (p.images && p.images !== "[]") score += 1
        return { p, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ p }) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image,
        unitQuantity: p.unitQuantity,
        unitMeasure: p.unitMeasure,
        price: p.prices[0]?.value ?? 0,
        oldPrice: p.prices[0]?.oldValue ?? undefined,
      }))

    return NextResponse.json({ products: scored })
  } catch (e) {
    console.error("[api/ai/recommend]", e)
    return NextResponse.json({ error: "Erro ao recomendar produtos" }, { status: 500 })
  }
}
