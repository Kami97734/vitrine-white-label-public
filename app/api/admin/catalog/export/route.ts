import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const format = (new URL(request.url).searchParams.get("format") ?? "json").toLowerCase()

  const [banners, homeRows, homeSections, menuRows, settingsRow, products] = await Promise.all([
    prisma.banner.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.homeContent.findMany({ select: { key: true, value: true } }),
    prisma.homeSection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ orderBy: { order: "asc" } }),
    prisma.siteSettings.findFirst(),
    prisma.product.findMany({
      include: {
        category: true,
        prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    }),
  ])

  const home: Record<string, string> = {}
  for (const r of homeRows) home[r.key] = r.value

  const config = {
    banners: banners.map((b) => ({
      title: b.title,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      sortOrder: b.sortOrder,
    })),
    home,
    homeSections: homeSections.map((s) => ({
      key: s.key,
      type: s.type,
      value: s.value,
      sortOrder: s.sortOrder,
    })),
    menu: {
      items: menuRows.map((i) => ({
        label: i.label,
        slugOrUrl: i.slugOrUrl,
        position: i.position,
        order: i.order,
        visible: i.visible,
        targetType: i.targetType,
        categoryId: i.categoryId,
      })),
    },
    settings: settingsRow
      ? {
          siteName: (settingsRow as any).siteName,
          primaryColor: (settingsRow as any).primaryColor,
          secondaryColor: (settingsRow as any).secondaryColor,
          accentColor: (settingsRow as any).accentColor,
          whatsappColor: (settingsRow as any).whatsappColor,
          saleColor: (settingsRow as any).saleColor,
          whatsappNumber: (settingsRow as any).whatsappNumber,
          phoneDisplay: (settingsRow as any).phoneDisplay,
          city: (settingsRow as any).city,
          addressLine: (settingsRow as any).addressLine,
          hoursWeekdays: (settingsRow as any).hoursWeekdays,
          hoursSaturday: (settingsRow as any).hoursSaturday,
          hoursSunday: (settingsRow as any).hoursSunday,
          facebookUrl: (settingsRow as any).facebookUrl ?? "",
          instagramUrl: (settingsRow as any).instagramUrl ?? "",
          tiktokUrl: (settingsRow as any).tiktokUrl ?? "",
          youtubeUrl: (settingsRow as any).youtubeUrl ?? "",
          linkedinUrl: (settingsRow as any).linkedinUrl ?? "",
          xUrl: (settingsRow as any).xUrl ?? "",
          customSocials: (settingsRow as any).customSocials ?? "[]",
          logoUrl: (settingsRow as any).logoUrl ?? "",
          faviconUrl: (settingsRow as any).faviconUrl ?? "",
          siteTagline: (settingsRow as any).siteTagline ?? "",
          heroWhatsappText: (settingsRow as any).heroWhatsappText ?? "",
          fabWhatsappText: (settingsRow as any).fabWhatsappText ?? "",
          ctaPrimaryText: (settingsRow as any).ctaPrimaryText ?? "",
          ctaSecondaryText: (settingsRow as any).ctaSecondaryText ?? "",
          ctaSecondaryUrl: (settingsRow as any).ctaSecondaryUrl ?? "",
          seoTitle: (settingsRow as any).seoTitle ?? "",
          seoDescription: (settingsRow as any).seoDescription ?? "",
          seoOgImageUrl: (settingsRow as any).seoOgImageUrl ?? "",
          seoBaseUrl: (settingsRow as any).seoBaseUrl ?? "",
          themePreset: (settingsRow as any).themePreset,
        }
      : {},
  }

  const catalogRows = products.map((p) => ({
    codigo: p.code ?? "",
    nome: p.name,
    descricao: p.description,
    categoria: p.category?.title ?? "",
    preco: p.prices[0]?.value ?? "",
    precoAntigo: p.prices[0]?.oldValue ?? "",
    imagemPrincipal: p.image,
    imagens: p.images ?? "",
  }))

  if (format === "csv") {
    const headers = Object.keys(catalogRows[0] ?? {
      codigo: "",
      nome: "",
      descricao: "",
      categoria: "",
      preco: "",
      precoAntigo: "",
      imagemPrincipal: "",
      imagens: "",
    })
    const lines = [headers.join(";")]
    for (const row of catalogRows) {
      lines.push(headers.map((h) => String((row as any)[h] ?? "").replaceAll(";", ",")).join(";"))
    }
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="catalogo.csv"',
      },
    })
  }

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new()
    const wsCatalog = XLSX.utils.json_to_sheet(catalogRows)
    const wsBanners = XLSX.utils.json_to_sheet(config.banners)
    const wsMenu = XLSX.utils.json_to_sheet(config.menu.items)
    XLSX.utils.book_append_sheet(wb, wsCatalog, "Catalogo")
    XLSX.utils.book_append_sheet(wb, wsBanners, "Banners")
    XLSX.utils.book_append_sheet(wb, wsMenu, "Menu")
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="catalogo.xlsx"',
      },
    })
  }

  return new NextResponse(JSON.stringify({ config, catalog: catalogRows }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="catalogo.json"',
    },
  })
}

