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

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const [
      emptyCategories,
      placeholderCount,
      productsWithoutPrice,
      bannersCount,
      settings,
      homeRows,
      homeSectionCount,
      orderCount,
    ] = await Promise.all([
      prisma.category.findMany({
        where: { products: { none: {} } },
        select: { id: true, title: true, slug: true },
        orderBy: { title: "asc" },
      }),
      prisma.product.count({ where: { image: "/images/placeholder.jpg" } }),
      prisma.product.count({ where: { prices: { none: {} } } }),
      prisma.banner.count(),
      prisma.siteSettings.findFirst(),
      prisma.homeContent.findMany({ select: { key: true } }),
      prisma.homeSection.count(),
      prisma.order.count(),
    ])

    const homeKeys = new Set(homeRows.map((r) => r.key))
    const missingHomeKeys = HOME_CONTENT_KEYS.filter((k) => !homeKeys.has(k))

    const seoBaseUrl = settings?.seoBaseUrl?.trim() ?? ""
    const seoLooksGeneric =
      !seoBaseUrl ||
      seoBaseUrl.includes("example.com") ||
      seoBaseUrl === "https://example.com"

    const issues: string[] = []
    if (emptyCategories.length) issues.push("empty_categories")
    if (placeholderCount > 0) issues.push("placeholder_images")
    if (productsWithoutPrice > 0) issues.push("products_no_price")
    if (bannersCount === 0) issues.push("no_banners")
    if (seoLooksGeneric) issues.push("seo_base_url")
    if (missingHomeKeys.length > 0) issues.push("missing_home_content")

    return NextResponse.json({
      ok: true,
      summary: {
        issueCount: issues.length,
        issues,
      },
      emptyCategories,
      placeholderCount,
      productsWithoutPrice,
      bannersCount,
      homeContentKeyCount: homeKeys.size,
      missingHomeKeys,
      homeSectionCount,
      seoLooksGeneric,
      seoBaseUrl: settings?.seoBaseUrl ?? null,
      orderCount,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao carregar saúde do catálogo" }, { status: 500 })
  }
}
