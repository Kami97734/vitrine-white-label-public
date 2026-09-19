import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { hashPassword } from "@/lib/admin-auth"
import { createAdminLog } from "@/lib/admin-log"

function mapSettings(row: any, adminEmail = "") {
  return {
    siteName: row?.siteName ?? "Demo Store",
    siteTagline:
      row?.siteTagline ??
      "Vitrine virtual para apresentar produtos e receber pedidos por WhatsApp.",
    primaryColor: row?.primaryColor ?? "#0c87b8",
    secondaryColor: row?.secondaryColor ?? "#0f172a",
    accentColor: row?.accentColor ?? "#f97316",
    whatsappColor: row?.whatsappColor ?? "#22c55e",
    saleColor: row?.saleColor ?? "#f97316",
    whatsappNumber: row?.whatsappNumber ?? "",
    phoneDisplay: row?.phoneDisplay ?? "",
    city: row?.city ?? "Sua cidade - UF",
    addressLine: row?.addressLine ?? "Rua Exemplo, 123 - Centro",
    hoursWeekdays: row?.hoursWeekdays ?? "Seg a Sex: 08:00 - 18:00",
    hoursSaturday: row?.hoursSaturday ?? "Sáb: 08:00 - 12:00",
    hoursSunday: row?.hoursSunday ?? "Dom: fechado",
    facebookUrl: row?.facebookUrl ?? "",
    instagramUrl: row?.instagramUrl ?? "",
    tiktokUrl: row?.tiktokUrl ?? "",
    youtubeUrl: row?.youtubeUrl ?? "",
    linkedinUrl: row?.linkedinUrl ?? "",
    xUrl: row?.xUrl ?? "",
    customSocials: row?.customSocials ?? "[]",
    logoUrl: row?.logoUrl ?? "",
    faviconUrl: row?.faviconUrl ?? "",
    heroWhatsappText:
      row?.heroWhatsappText ??
      "Olá! Quero fazer um pedido. Vi o catálogo da {siteName} e quero comprar.",
    fabWhatsappText:
      row?.fabWhatsappText ??
      "Olá! Quero fazer um pedido ou tirar dúvidas sobre os produtos da {siteName}.",
    ctaPrimaryText: row?.ctaPrimaryText ?? "Fazer pedido no WhatsApp",
    ctaSecondaryText: row?.ctaSecondaryText ?? "Ver Ofertas",
    ctaSecondaryUrl: row?.ctaSecondaryUrl ?? "#ofertas",
    promoSectionTitle: row?.promoSectionTitle ?? "Ofertas Imperdíveis",
    promoSectionSubtitle: row?.promoSectionSubtitle ?? "Aproveite nossos preços especiais",
    seoTitle: row?.seoTitle ?? "Catálogo de Produtos | Vitrine Virtual",
    seoDescription:
      row?.seoDescription ??
      "Vitrine virtual para apresentar catálogos de produtos com preços, ofertas e pedidos por WhatsApp.",
    seoOgImageUrl: row?.seoOgImageUrl ?? "/og-image.png",
    seoBaseUrl: row?.seoBaseUrl ?? "https://example.com",
    themePreset: row?.themePreset ?? "default",
    heroCarouselEnabled: row?.heroCarouselEnabled ?? false,
    adminPanelTitle: row?.adminPanelTitle ?? "Painel Admin",
    adminPanelSubtitle: row?.adminPanelSubtitle ?? "Gerencie catálogo, vitrine e configurações.",
    adminLogoUrl: row?.adminLogoUrl ?? "",
    language: row?.language ?? "pt-BR",
    cartEnabled: row?.cartEnabled ?? true,
    aiProvider: row?.aiProvider ?? "groq",
    aiApiKey: row?.aiApiKey ?? "",
    aiModel: row?.aiModel ?? "",
    aiTemperature: row?.aiTemperature ?? 0.7,
    aiMaxTokens: row?.aiMaxTokens ?? 1024,
    aiChatEnabled: row?.aiChatEnabled ?? false,
    aiDescribeEnabled: row?.aiDescribeEnabled ?? true,
    aiRecommendEnabled: row?.aiRecommendEnabled ?? false,
    adminEmail,
  }
}

export async function GET() {
  const row = await prisma.siteSettings.findFirst()
  const admin = await prisma.admin.findFirst({ select: { email: true } })
  return NextResponse.json(mapSettings(row, admin?.email ?? ""))
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const body = await request.json()
    const {
      siteName,
      siteTagline,
      primaryColor,
      secondaryColor,
      accentColor,
      whatsappColor,
      saleColor,
      whatsappNumber,
      phoneDisplay,
      city,
      addressLine,
      hoursWeekdays,
      hoursSaturday,
      hoursSunday,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      youtubeUrl,
      linkedinUrl,
      xUrl,
      customSocials,
      logoUrl,
      faviconUrl,
      heroWhatsappText,
      fabWhatsappText,
      ctaPrimaryText,
      ctaSecondaryText,
      ctaSecondaryUrl,
      heroCarouselEnabled,
      promoSectionTitle,
      promoSectionSubtitle,
      seoTitle,
      seoDescription,
      seoOgImageUrl,
      seoBaseUrl,
      themePreset,
      adminPanelTitle,
      adminPanelSubtitle,
      adminLogoUrl,
      language,
      cartEnabled,
      aiProvider,
      aiApiKey,
      aiModel,
      aiTemperature,
      aiMaxTokens,
      aiChatEnabled,
      aiDescribeEnabled,
      aiRecommendEnabled,
      adminEmail,
      newPassword,
    } = body

    let settings = await prisma.siteSettings.findFirst()
    if (
      siteName != null ||
      siteTagline != null ||
      primaryColor != null ||
      secondaryColor != null ||
      accentColor != null ||
      whatsappColor != null ||
      saleColor != null ||
      whatsappNumber != null ||
      phoneDisplay != null ||
      city != null ||
      addressLine != null ||
      hoursWeekdays != null ||
      hoursSaturday != null ||
      hoursSunday != null ||
      facebookUrl != null ||
      instagramUrl != null ||
      tiktokUrl != null ||
      youtubeUrl != null ||
      linkedinUrl != null ||
      xUrl != null ||
      customSocials != null ||
      logoUrl != null ||
      faviconUrl != null ||
      heroWhatsappText != null ||
      fabWhatsappText != null ||
      ctaPrimaryText != null ||
      ctaSecondaryText != null ||
      ctaSecondaryUrl != null ||
      heroCarouselEnabled != null ||
      promoSectionTitle != null ||
      promoSectionSubtitle != null ||
      seoTitle != null ||
      seoDescription != null ||
      seoOgImageUrl != null ||
      seoBaseUrl != null ||
      themePreset != null ||
      adminPanelTitle != null ||
      adminPanelSubtitle != null ||
      adminLogoUrl != null ||
      language != null ||
      cartEnabled != null ||
      aiProvider != null ||
      aiApiKey != null ||
      aiModel != null ||
      aiTemperature != null ||
      aiMaxTokens != null ||
      aiChatEnabled != null ||
      aiDescribeEnabled != null ||
      aiRecommendEnabled != null
    ) {
      const data: {
        siteName?: string
        siteTagline?: string
        primaryColor?: string
        secondaryColor?: string
        accentColor?: string
        whatsappColor?: string
        saleColor?: string
        whatsappNumber?: string
        phoneDisplay?: string
        city?: string
        addressLine?: string
        hoursWeekdays?: string
        hoursSaturday?: string
        hoursSunday?: string
        facebookUrl?: string
        instagramUrl?: string
        tiktokUrl?: string
        youtubeUrl?: string
        linkedinUrl?: string
        xUrl?: string
        customSocials?: string
        logoUrl?: string
        faviconUrl?: string
        heroWhatsappText?: string
        fabWhatsappText?: string
        ctaPrimaryText?: string
        ctaSecondaryText?: string
        ctaSecondaryUrl?: string
        promoSectionTitle?: string
        promoSectionSubtitle?: string
        seoTitle?: string
        seoDescription?: string
        seoOgImageUrl?: string
        seoBaseUrl?: string
        themePreset?: string
        adminPanelTitle?: string
        adminPanelSubtitle?: string
        adminLogoUrl?: string
        language?: string
        cartEnabled?: boolean
        aiProvider?: string
        aiApiKey?: string
        aiModel?: string
        aiTemperature?: number
        aiMaxTokens?: number
        aiChatEnabled?: boolean
        aiDescribeEnabled?: boolean
        aiRecommendEnabled?: boolean
        heroCarouselEnabled?: boolean
      } = {}
      if (siteName != null) data.siteName = String(siteName).trim()
      if (siteTagline != null) data.siteTagline = String(siteTagline).trim()
      if (primaryColor != null) data.primaryColor = String(primaryColor).trim()
      if (secondaryColor != null) data.secondaryColor = String(secondaryColor).trim()
      if (accentColor != null) data.accentColor = String(accentColor).trim()
      if (whatsappColor != null) data.whatsappColor = String(whatsappColor).trim()
      if (saleColor != null) data.saleColor = String(saleColor).trim()
      if (whatsappNumber != null) data.whatsappNumber = String(whatsappNumber).trim()
      if (phoneDisplay != null) data.phoneDisplay = String(phoneDisplay).trim()
      if (city != null) data.city = String(city).trim()
      if (addressLine != null) data.addressLine = String(addressLine).trim()
      if (hoursWeekdays != null) data.hoursWeekdays = String(hoursWeekdays).trim()
      if (hoursSaturday != null) data.hoursSaturday = String(hoursSaturday).trim()
      if (hoursSunday != null) data.hoursSunday = String(hoursSunday).trim()
      if (facebookUrl != null) data.facebookUrl = String(facebookUrl).trim()
      if (instagramUrl != null) data.instagramUrl = String(instagramUrl).trim()
      if (tiktokUrl != null) data.tiktokUrl = String(tiktokUrl).trim()
      if (youtubeUrl != null) data.youtubeUrl = String(youtubeUrl).trim()
      if (linkedinUrl != null) data.linkedinUrl = String(linkedinUrl).trim()
      if (xUrl != null) data.xUrl = String(xUrl).trim()
      if (customSocials != null) data.customSocials = String(customSocials).trim()
      if (logoUrl != null) data.logoUrl = String(logoUrl).trim()
      if (faviconUrl != null) data.faviconUrl = String(faviconUrl).trim()
      if (heroWhatsappText != null) data.heroWhatsappText = String(heroWhatsappText).trim()
      if (fabWhatsappText != null) data.fabWhatsappText = String(fabWhatsappText).trim()
      if (ctaPrimaryText != null) data.ctaPrimaryText = String(ctaPrimaryText).trim()
      if (ctaSecondaryText != null) data.ctaSecondaryText = String(ctaSecondaryText).trim()
      if (ctaSecondaryUrl != null) data.ctaSecondaryUrl = String(ctaSecondaryUrl).trim()
      if (promoSectionTitle != null) data.promoSectionTitle = String(promoSectionTitle).trim()
      if (promoSectionSubtitle != null)
        data.promoSectionSubtitle = String(promoSectionSubtitle).trim()
      if (seoTitle != null) data.seoTitle = String(seoTitle).trim()
      if (seoDescription != null) data.seoDescription = String(seoDescription).trim()
      if (seoOgImageUrl != null) data.seoOgImageUrl = String(seoOgImageUrl).trim()
      if (seoBaseUrl != null) data.seoBaseUrl = String(seoBaseUrl).trim()
      if (themePreset != null) data.themePreset = String(themePreset).trim()
      if (adminPanelTitle != null) data.adminPanelTitle = String(adminPanelTitle).trim()
      if (adminPanelSubtitle != null) data.adminPanelSubtitle = String(adminPanelSubtitle).trim()
      if (adminLogoUrl != null) data.adminLogoUrl = String(adminLogoUrl).trim()
      if (language != null) data.language = String(language).trim()
      if (cartEnabled != null) data.cartEnabled = Boolean(cartEnabled)
      if (aiProvider != null) data.aiProvider = String(aiProvider).trim()
      if (aiApiKey != null) data.aiApiKey = String(aiApiKey).trim()
      if (aiModel != null) data.aiModel = String(aiModel).trim()
      if (aiTemperature != null) data.aiTemperature = Number(aiTemperature)
      if (aiMaxTokens != null) data.aiMaxTokens = Number(aiMaxTokens)
      if (aiChatEnabled != null) data.aiChatEnabled = Boolean(aiChatEnabled)
      if (aiDescribeEnabled != null) data.aiDescribeEnabled = Boolean(aiDescribeEnabled)
      if (aiRecommendEnabled != null) data.aiRecommendEnabled = Boolean(aiRecommendEnabled)
      if (heroCarouselEnabled != null) data.heroCarouselEnabled = Boolean(heroCarouselEnabled)

      if (settings) {
        settings = await prisma.siteSettings.update({
          where: { id: settings.id },
          data: data as any,
        })
      } else {
        settings = await prisma.siteSettings.create({
          data: {
            ...data,
            siteName: data.siteName ?? "Demo Store",
            siteTagline: data.siteTagline ?? "Vitrine virtual...",
            primaryColor: data.primaryColor ?? "#0c87b8",
            secondaryColor: data.secondaryColor ?? "#0f172a",
            accentColor: data.accentColor ?? "#f97316",
            whatsappColor: data.whatsappColor ?? "#22c55e",
            saleColor: data.saleColor ?? "#f97316",
            themePreset: data.themePreset ?? "default",
          } as any,
        })
      }
    }

    const existing = await prisma.admin.findUnique({ where: { id: admin.id } })
    if (!existing) return NextResponse.json({ error: "Admin não encontrado" }, { status: 404 })

    if (adminEmail != null && String(adminEmail).trim() !== "") {
      const normalizedEmail = String(adminEmail).trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 })
      }
      await prisma.admin.update({
        where: { id: admin.id },
        data: { email: normalizedEmail },
      })
    }
    if (newPassword != null && String(newPassword).trim() !== "") {
      const pwd = String(newPassword).trim()
      if (pwd.length < 8) {
        return NextResponse.json(
          { error: "A nova senha deve ter pelo menos 8 caracteres." },
          { status: 400 }
        )
      }
      const hashed = await hashPassword(pwd)
      await prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash: hashed },
      })
    }

    const row = await prisma.siteSettings.findFirst()
    const updatedAdmin = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: { email: true },
    })

    console.log("[admin:audit] Configurações atualizadas", {
      adminId: admin.id,
      siteName: row?.siteName,
      primaryColor: row?.primaryColor,
      whatsappColor: row?.whatsappColor,
      saleColor: row?.saleColor,
      whatsappNumber: row?.whatsappNumber,
      phoneDisplay: row?.phoneDisplay,
      city: row?.city,
      adminEmail: updatedAdmin?.email,
    })
    await createAdminLog({
      adminId: admin.id,
      action: "settings.update",
      entityType: "siteSettings",
      entityId: row?.id,
      details: {
        changed: Object.keys(body),
      },
      afterData: {
        siteName: row?.siteName ?? "",
        siteTagline: row?.siteTagline ?? "",
        themePreset: row?.themePreset ?? "",
        whatsappNumber: row?.whatsappNumber ?? "",
        adminEmail: updatedAdmin?.email ?? "",
      },
      request,
    })

    return NextResponse.json(mapSettings(row, updatedAdmin?.email ?? ""))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 })
  }
}
