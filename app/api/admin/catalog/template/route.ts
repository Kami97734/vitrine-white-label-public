import { NextRequest, NextResponse } from "next/server"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const config = {
    banners: [
      {
        title: "Banner exemplo",
        imageUrl: "/uploads/SEU_ARQUIVO.jpg",
        linkUrl: "/categorias",
        sortOrder: 0,
      },
    ],
    home: {
      heroTitle: "Bem-vindo ao catálogo",
      heroSubtitle: "Confira nossas ofertas",
      highlightPhrase: "Ofertas especiais",
      section1Title: "Embalagens",
      section1Content: "Texto da seção 1 (pode ser curto ou longo).",
      section2Title: "Qualidade",
      section2Content: "Texto da seção 2 (você pode editar no painel).",
    },
    homeSections: [
      {
        key: "sobre_a_empresa",
        type: "text",
        value: "Conteúdo da seção dinâmica",
        sortOrder: 0,
      },
    ],
    menu: {
      items: [
        {
          label: "Início",
          slugOrUrl: "/",
          position: "header",
          order: 0,
          visible: true,
          targetType: "url",
          categoryId: null,
        },
      ],
    },
    settings: {
      siteName: "Sua Loja",
      primaryColor: "#0c87b8",
      secondaryColor: "#0f172a",
      accentColor: "#f97316",
      whatsappColor: "#22c55e",
      saleColor: "#f97316",
      whatsappNumber: "5531999999999",
      phoneDisplay: "(31) 99999-9999",
      city: "Sua Cidade - UF",
      addressLine: "Endereço completo",
      hoursWeekdays: "Seg a Sex: 08:00 - 18:00",
      hoursSaturday: "Sáb: 08:00 - 12:00",
      hoursSunday: "Dom: fechado",
      facebookUrl: "",
      instagramUrl: "",
      tiktokUrl: "",
      youtubeUrl: "",
      linkedinUrl: "",
      xUrl: "",
      customSocials: "[]",
      logoUrl: "",
      faviconUrl: "",
      siteTagline: "Slogan da loja",
      heroWhatsappText: "Olá! Quero fazer um pedido na {siteName}.",
      fabWhatsappText: "Olá! Vim pelo site {siteName} e preciso de atendimento.",
      ctaPrimaryText: "Fazer pedido no WhatsApp",
      ctaSecondaryText: "Ver Ofertas",
      ctaSecondaryUrl: "#ofertas",
      seoTitle: "Título SEO",
      seoDescription: "Descrição SEO",
      seoOgImageUrl: "/og-image.png",
      seoBaseUrl: "https://example.com",
      themePreset: "default",
    },
  }

  return new NextResponse(JSON.stringify(config, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="config.template.json"',
    },
  })
}

