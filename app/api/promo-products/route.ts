import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PROMO_IDS_KEY = "promoProductIds"

export async function GET() {
  try {
    const row = await prisma.homeContent.findUnique({
      where: { key: PROMO_IDS_KEY },
    })
    const ids: string[] = row?.value ? (JSON.parse(row.value) as string[]) : []
    if (ids.length === 0) return NextResponse.json([])

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
      },
    })
    const byId = new Map(products.map((p) => [p.id, p]))
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof products
    const list = ordered.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.image,
      unitQuantity: p.unitQuantity,
      unitMeasure: p.unitMeasure,
      price: p.prices[0]?.value ?? 0,
      oldPrice: p.prices[0]?.oldValue ?? undefined,
    }))
    return NextResponse.json(list)
  } catch (e) {
    console.error(e)
    return NextResponse.json([], { status: 200 })
  }
}
