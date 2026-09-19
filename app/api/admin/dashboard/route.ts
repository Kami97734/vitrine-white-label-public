import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

const HOME_CONTENT_KEYS = [
  "heroTitle",
  "heroSubtitle",
  "highlightPhrase",
  "section1Title",
  "section1Content",
  "section2Title",
  "section2Content",
] as const

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  try {
    const [
      productsCount,
      categoriesCount,
      bannersCount,
      placeholderCount,
      homeCount,
      productsWithoutPrice,
      ordersCount,
      homeKeysRows,
      settingsRow,
      categoryProductCounts,
      logGroups24h,
      recentFailures,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.banner.count(),
      prisma.product.count({ where: { image: "/images/placeholder.jpg" } }),
      prisma.homeContent.count(),
      prisma.product.count({ where: { prices: { none: {} } } }),
      prisma.order.count(),
      prisma.homeContent.findMany({ select: { key: true } }),
      prisma.siteSettings.findFirst(),
      prisma.category.findMany({
        select: {
          title: true,
          _count: { select: { products: true } },
        },
        orderBy: { title: "asc" },
      }),
      prisma.adminLog.groupBy({
        by: ["result"],
        where: { createdAt: { gte: since24h } },
        _count: { _all: true },
      }),
      prisma.adminLog.findMany({
        where: { result: { in: ["failed", "warning"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          action: true,
          result: true,
          details: true,
          path: true,
          createdAt: true,
        },
      }),
    ])

    const emptyCategoriesCount = await prisma.category.count({
      where: {
        products: { none: {} },
      },
    })

    const productsWithLatest = await prisma.product.findMany({
      include: {
        category: { select: { title: true } },
        prices: { orderBy: { effectiveAt: "desc" }, take: 1, select: { value: true } },
      },
    })

    const byCategory: Record<
      string,
      { sum: number; count: number }
    > = {}
    for (const p of productsWithLatest) {
      const catTitle = p.category?.title ?? "Sem categoria"
      const price = p.prices[0]?.value
      if (price == null) continue
      byCategory[catTitle] ??= { sum: 0, count: 0 }
      byCategory[catTitle].sum += price
      byCategory[catTitle].count += 1
    }

    const priceAvgByCategory = Object.entries(byCategory)
      .map(([category, data]) => ({
        category,
        avgPrice: data.count ? data.sum / data.count : 0,
        productCount: data.count,
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice)

    const priceChanges = await prisma.price.findMany({
      where: {
        effectiveAt: { gte: since },
        oldValue: { not: null },
      },
      select: { effectiveAt: true, oldValue: true, value: true },
    })

    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(Date.now() - (6 - idx) * 24 * 60 * 60 * 1000)
      return { date: toISODate(d), label: d.toLocaleDateString("pt-BR") }
    })

    const byDay: Record<string, number> = {}
    for (const d of days) byDay[d.date] = 0

    for (const p of priceChanges) {
      const dayKey = toISODate(new Date(p.effectiveAt))
      // Se oldValue existir, conta como mudança (mesmo que value seja igual por algum motivo).
      if (byDay[dayKey] != null) byDay[dayKey] += p.oldValue !== null ? 1 : 0
    }

    const priceChangesByDay = days.map((d) => ({
      date: d.date,
      label: d.label,
      count: byDay[d.date] ?? 0,
    }))

    const activity = await prisma.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        admin: { select: { email: true } },
      },
    })

    const homeKeys = new Set(homeKeysRows.map((r) => r.key))
    const missingHomeKeys = HOME_CONTENT_KEYS.filter((k) => !homeKeys.has(k))
    const seoBaseUrl = settingsRow?.seoBaseUrl?.trim() ?? ""
    const seoLooksGeneric =
      !seoBaseUrl ||
      seoBaseUrl.includes("example.com") ||
      seoBaseUrl === "https://example.com"

    let healthIssueCount = 0
    if (emptyCategoriesCount > 0) healthIssueCount++
    if (placeholderCount > 0) healthIssueCount++
    if (productsWithoutPrice > 0) healthIssueCount++
    if (bannersCount === 0) healthIssueCount++
    if (seoLooksGeneric) healthIssueCount++
    if (missingHomeKeys.length > 0) healthIssueCount++

    const productsByCategory = categoryProductCounts.map((c) => ({
      category: c.title,
      count: c._count.products,
    }))

    const logs24h = logGroups24h.map((g) => ({
      result: g.result ?? "unknown",
      count: g._count._all,
    }))

    return NextResponse.json({
      ok: true,
      metrics: {
        productsCount,
        categoriesCount,
        bannersCount,
        bannersMissing: bannersCount === 0,
        placeholderCount,
        emptyCategoriesCount,
        homeMissing: homeCount === 0,
        homeCount,
        productsWithoutPrice,
        ordersCount,
        healthIssueCount,
      },
      settings: {
        heroCarouselEnabled: settingsRow?.heroCarouselEnabled ?? false,
      },
      charts: {
        priceAvgByCategory,
        priceChangesByDay,
        productsByCategory,
      },
      logs24h,
      recentFailures: recentFailures.map((log) => ({
        id: log.id,
        action: log.action,
        result: log.result,
        details: log.details,
        path: log.path,
        createdAt: log.createdAt,
      })),
      activity: activity.map((log) => ({
        id: log.id,
        action: log.action,
        adminEmail: log.admin?.email ?? null,
        details: log.details,
        ip: log.ip,
        path: log.path,
        createdAt: log.createdAt,
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao montar dashboard" }, { status: 500 })
  }
}

