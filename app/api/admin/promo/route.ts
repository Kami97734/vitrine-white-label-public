import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { createAdminLog } from "@/lib/admin-log"

const PROMO_IDS_KEY = "promoProductIds"
const AUTO_PROMO_ENABLED_KEY = "autoPromoEnabled"

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const row = await prisma.homeContent.findUnique({
      where: { key: PROMO_IDS_KEY },
    })
    const ids: string[] = row?.value ? (JSON.parse(row.value) as string[]) : []
    const autoRow = await prisma.homeContent.findUnique({
      where: { key: AUTO_PROMO_ENABLED_KEY },
    })
    const autoEnabled = autoRow?.value === "true"
    return NextResponse.json({ productIds: ids, autoEnabled })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao carregar" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const body = await request.json()
    const { productIds, autoEnabled } = body

    await prisma.homeContent.upsert({
      where: { key: PROMO_IDS_KEY },
      create: { key: PROMO_IDS_KEY, value: JSON.stringify(productIds || []) },
      update: { value: JSON.stringify(productIds || []) },
    })

    await prisma.homeContent.upsert({
      where: { key: AUTO_PROMO_ENABLED_KEY },
      create: { key: AUTO_PROMO_ENABLED_KEY, value: autoEnabled ? "true" : "false" },
      update: { value: autoEnabled ? "true" : "false" },
    })

    console.log("[admin:audit] Produtos em destaque atualizados", {
      adminId: admin.id,
      productIdsCount: (productIds || []).length,
      autoEnabled,
    })
    await createAdminLog({
      adminId: admin.id,
      action: "promo.update",
      details: { productIdsCount: (productIds || []).length, autoEnabled },
      request,
    })

    // Se promoção automática estiver ativada e não tiver productIds manuais, ative a análise auto-promo
    if (autoEnabled && (!productIds || productIds.length === 0)) {
      await analyzeAndUpdateAutoPromo(admin.id)
    }

    return NextResponse.json({ ok: true, productIds: productIds || [], autoEnabled })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 })
  }
}

async function analyzeAndUpdateAutoPromo(adminId: string) {
  try {
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const productStats = await prisma.$transaction([
      prisma.product.findMany({
        where: {
          OR: [
            { createdAt: { gte: ninetyDaysAgo } },
            { prices: { some: { effectiveAt: { gte: ninetyDaysAgo } } } }
          ]
        },
        include: {
          prices: {
            where: { effectiveAt: { lt: now } },
            orderBy: { effectiveAt: "desc" },
            take: 1,
          },
          category: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count(),
      prisma.category.count(),
    ])

    const products = productStats[0]
    const totalProducts = productStats[1]
    const totalCategories = productStats[2]

    const selectedProductIds: string[] = []

    if (totalProducts === 0) {
      console.log("[admin:auto-promo] Nenhum produto encontrado")
      return
    }

    const topProducts = products
      .filter(p => {
        const isNew = p.createdAt >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const isHighVolume = p.category?.title && ['Lona', 'Bandejas', 'Copos'].includes(p.category.title)
        const hasGoodPrice = p.prices[0]?.value && p.prices[0]?.value > 50
        const hasDescription = p.description && p.description.length > 50
        const hasUnitFields = (p as any).unitQuantity && (p as any).unitMeasure

        return isNew || isHighVolume || (hasGoodPrice && hasDescription && hasUnitFields)
      })
      .slice(0, 8)

    selectedProductIds.push(...topProducts.map(p => p.id))

    if (selectedProductIds.length < 6 && totalCategories > 0) {
      const categoryProducts = products.filter(p => p.categoryId && (p as any).unitQuantity && (p as any).unitMeasure)

      const byCategory = new Map<string, typeof categoryProducts>()
      categoryProducts.forEach(p => {
        if (p.categoryId) {
          if (!byCategory.has(p.categoryId)) {
            byCategory.set(p.categoryId, [])
          }
          byCategory.get(p.categoryId)?.push(p)
        }
      })

      const oneFromEachCategory = Array.from(byCategory.values())
        .filter(cats => cats.length > 0)
        .map(cats => cats[0])
        .slice(0, Math.min(4, byCategory.size))

      selectedProductIds.push(...oneFromEachCategory.map(p => p.id))
    }

    if (selectedProductIds.length === 0) {
      const bestProducts = products
        .filter(p => {
          const hasDescription = p.description && p.description.length > 50
          const hasUnitFields = (p as any).unitQuantity && (p as any).unitMeasure
          const hasPrice = p.prices[0]?.value && p.prices[0]?.value > 30
          const hasCategory = p.categoryId || totalCategories > 0

          return hasDescription && hasUnitFields && (hasPrice || hasCategory)
        })
        .slice(0, Math.min(8, products.length))

      selectedProductIds.push(...bestProducts.map(p => p.id))
    }

    if (selectedProductIds.length > 0) {
      await prisma.homeContent.upsert({
        where: { key: PROMO_IDS_KEY },
        create: { key: PROMO_IDS_KEY, value: JSON.stringify(selectedProductIds) },
        update: { value: JSON.stringify(selectedProductIds) },
      })

      console.log("[admin:auto-promo] Promoção automática concluída", {
        adminId,
        selectedCount: selectedProductIds.length,
        selectedProductIds,
      })

      await createAdminLog({
        adminId,
        action: "promo.auto.update",
        details: {
          selectedCount: selectedProductIds.length,
          selectedProductIds,
          generationTimestamp: now.toISOString(),
        },
        request: {} as NextRequest,
      })
    } else {
      console.log("[admin:auto-promo] Nenhum produto elegível encontrado")
    }
  } catch (e) {
    console.error("[admin:auto-promo] Erro ao gerar promoção automática:", e)
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    await analyzeAndUpdateAutoPromo(admin.id)
    return NextResponse.json({ ok: true, message: "Promoção automática concluída" })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao gerar promoção automática" }, { status: 500 })
  }
}
