import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { createAdminLog } from "@/lib/admin-log"
import { getTemplateById } from "@/lib/templates"

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const { templateId } = await request.json()
    if (!templateId) return NextResponse.json({ error: "templateId é obrigatório" }, { status: 400 })

    const template = getTemplateById(templateId)
    if (!template) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })

    const s = template.settings

    const existing = await prisma.siteSettings.findFirst()
    if (existing) {
      await prisma.siteSettings.update({
        where: { id: existing.id },
        data: {
          siteName: s.siteName,
          siteTagline: s.siteTagline,
          primaryColor: s.primaryColor,
          secondaryColor: s.secondaryColor,
          accentColor: s.accentColor,
          whatsappColor: s.whatsappColor,
          saleColor: s.saleColor,
          city: s.city,
          addressLine: s.addressLine,
          hoursWeekdays: s.hoursWeekdays,
          hoursSaturday: s.hoursSaturday,
          hoursSunday: s.hoursSunday,
          heroWhatsappText: s.heroWhatsappText,
          fabWhatsappText: s.fabWhatsappText,
          ctaPrimaryText: s.ctaPrimaryText,
          ctaSecondaryText: s.ctaSecondaryText,
          promoSectionTitle: s.promoSectionTitle,
          promoSectionSubtitle: s.promoSectionSubtitle,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          themePreset: template.id,
        },
      })
    } else {
      await prisma.siteSettings.create({
        data: {
          siteName: s.siteName,
          siteTagline: s.siteTagline,
          primaryColor: s.primaryColor,
          secondaryColor: s.secondaryColor,
          accentColor: s.accentColor,
          whatsappColor: s.whatsappColor,
          saleColor: s.saleColor,
          city: s.city,
          addressLine: s.addressLine,
          hoursWeekdays: s.hoursWeekdays,
          hoursSaturday: s.hoursSaturday,
          hoursSunday: s.hoursSunday,
          heroWhatsappText: s.heroWhatsappText,
          fabWhatsappText: s.fabWhatsappText,
          ctaPrimaryText: s.ctaPrimaryText,
          ctaSecondaryText: s.ctaSecondaryText,
          promoSectionTitle: s.promoSectionTitle,
          promoSectionSubtitle: s.promoSectionSubtitle,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          themePreset: template.id,
        },
      })
    }

    // Remove categorias e menus antigos antes de aplicar o template
    await prisma.menuItem.deleteMany()
    await prisma.category.deleteMany()

    for (const cat of template.categories) {
      await prisma.category.create({ data: { slug: cat.slug, title: cat.title } })
    }

    for (let i = 0; i < template.menuItems.length; i++) {
      const mi = template.menuItems[i]
      const category = mi.slugOrUrl.startsWith("/")
        ? null
        : await prisma.category.findUnique({ where: { slug: mi.slugOrUrl } })

      await prisma.menuItem.create({
        data: {
          label: mi.label,
          slugOrUrl: mi.slugOrUrl,
          position: mi.position ?? "header",
          order: i,
          targetType: category ? "category" : "url",
          categoryId: category?.id ?? null,
        },
      })
    }

    await createAdminLog({
      adminId: admin.id,
      action: "template.apply",
      entityType: "template",
      details: { templateId, templateName: template.name },
      request,
    })

    return NextResponse.json({ success: true, template: template.id, name: template.name })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao aplicar template" }, { status: 500 })
  }
}
