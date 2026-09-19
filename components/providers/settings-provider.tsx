"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface SiteSettings {
  siteName: string
  siteTagline: string
  whatsappNumber: string
  phoneDisplay: string
  city: string
  addressLine: string
  hoursWeekdays: string
  hoursSaturday: string
  hoursSunday: string
  logoUrl: string
  ctaPrimaryText: string
  ctaSecondaryText: string
  ctaSecondaryUrl: string
  heroWhatsappText: string
  fabWhatsappText: string
  heroCarouselEnabled: boolean
  promoSectionTitle: string
  promoSectionSubtitle: string
  facebookUrl: string
  instagramUrl: string
  tiktokUrl: string
  youtubeUrl: string
  linkedinUrl: string
  xUrl: string
  customSocials: string
  adminPanelTitle: string
  adminPanelSubtitle: string
  adminLogoUrl: string
  language: string
  cartEnabled: boolean
  aiProvider: string
  aiApiKey: string
  aiModel: string
  aiTemperature: number
  aiMaxTokens: number
  aiChatEnabled: boolean
  aiDescribeEnabled: boolean
  aiRecommendEnabled: boolean
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Demo Store",
  siteTagline: "Vitrine virtual para apresentar produtos e receber pedidos por WhatsApp.",
  whatsappNumber: "",
  phoneDisplay: "",
  city: "Sua cidade - UF",
  addressLine: "Rua Exemplo, 123 - Centro",
  hoursWeekdays: "Seg a Sex: 08:00 - 18:00",
  hoursSaturday: "Sáb: 08:00 - 12:00",
  hoursSunday: "Dom: fechado",
  logoUrl: "",
  ctaPrimaryText: "Fazer pedido no WhatsApp",
  ctaSecondaryText: "Ver Ofertas",
  ctaSecondaryUrl: "#ofertas",
  heroWhatsappText: "Olá! Quero fazer um pedido. Vi o catálogo da {siteName} e quero comprar.",
  fabWhatsappText: "Olá! Quero fazer um pedido ou tirar dúvidas sobre os produtos da {siteName}.",
  heroCarouselEnabled: false,
  promoSectionTitle: "Ofertas Imperdíveis",
  promoSectionSubtitle: "Aproveite nossos preços especiais",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  xUrl: "",
  customSocials: "[]",
  adminPanelTitle: "Painel Admin",
  adminPanelSubtitle: "Gerencie catálogo, vitrine e configurações.",
  adminLogoUrl: "",
  language: "pt-BR",
  cartEnabled: true,
  aiProvider: "groq",
  aiApiKey: "",
  aiModel: "",
  aiTemperature: 0.7,
  aiMaxTokens: 1024,
  aiChatEnabled: false,
  aiDescribeEnabled: true,
  aiRecommendEnabled: false,
}

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Partial<SiteSettings>) => {
        setSettings((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
          ),
        }))
      })
      .catch(() => {
        // mantém defaults em caso de erro
      })
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext)
}
