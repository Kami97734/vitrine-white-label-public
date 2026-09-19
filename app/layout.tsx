import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "@/components/providers/session-provider"
import { SettingsProvider } from "@/components/providers/settings-provider"
import { LocaleProvider } from "@/components/providers/locale-provider"
import { CartProvider } from "@/lib/cart-context"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { prisma } from "@/lib/prisma"
import { StructuredData } from "./structured-data"
import { AiChatButton } from "@/components/ai-chat-button"
import { ScrollToTop } from "@/components/scroll-to-top"
import { WhatsAppFab } from "@/components/whatsapp-fab"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

async function loadSiteSettings() {
  try {
    return await prisma.siteSettings.findFirst()
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSiteSettings()
  const baseUrl = settings?.seoBaseUrl?.trim() || "https://example.com"
  const metadataBase = baseUrl.startsWith("http") ? new URL(baseUrl) : new URL("https://example.com")
  const siteName = settings?.siteName ?? "Catalogo de Produtos"
  const title = settings?.seoTitle?.trim() || `${siteName} | Vitrine Virtual`
  const description =
    settings?.seoDescription?.trim() ||
    settings?.siteTagline?.trim() ||
    "Vitrine virtual para apresentar catalogos de produtos com precos, ofertas e pedidos por WhatsApp."
  const ogImage = settings?.seoOgImageUrl?.trim() || "/og-image.png"
  const favicon = settings?.faviconUrl?.trim() || "/favicon.ico"

  return {
    metadataBase,
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName,
      title,
      description,
      url: baseUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await loadSiteSettings()
  const primaryHex = settings?.primaryColor?.trim() || "#0c87b8"
  return {
    themeColor: primaryHex,
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  }
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let normalized = hex.trim().replace("#", "")
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("")
  }
  if (normalized.length !== 6) {
    return { h: 199, s: 87, l: 38 } // fallback aproximado de #0c87b8
  }
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await loadSiteSettings()
  const primaryHex = settings?.primaryColor ?? "#0c87b8"
  const secondaryHex = settings?.secondaryColor ?? "#0f172a"
  const accentHex = settings?.accentColor ?? "#f97316"
  const whatsappHex = settings?.whatsappColor ?? "#22c55e"
  const saleHex = settings?.saleColor ?? "#f97316"

  const primaryHsl = hexToHsl(primaryHex)
  const secondaryHsl = hexToHsl(secondaryHex)
  const accentHsl = hexToHsl(accentHex)
  const whatsappHsl = hexToHsl(whatsappHex)
  const saleHsl = hexToHsl(saleHex)

  const primaryVar = `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`
  const secondaryVar = `${secondaryHsl.h} ${secondaryHsl.s}% ${secondaryHsl.l}%`
  const accentVar = `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`
  const whatsappVar = `${whatsappHsl.h} ${whatsappHsl.s}% ${whatsappHsl.l}%`
  const saleVar = `${saleHsl.h} ${saleHsl.s}% ${saleHsl.l}%`
  const lang = (settings as any)?.language ?? "pt-BR"

  return (
      <html lang={lang} suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        style={
          {
            "--primary": primaryVar,
            "--primary-foreground": primaryHsl.l > 55 ? "0 0% 10%" : "0 0% 98%",
            "--secondary": secondaryVar,
            "--secondary-foreground": secondaryHsl.l > 55 ? "0 0% 10%" : "0 0% 98%",
            "--accent": accentVar,
            "--accent-foreground": accentHsl.l > 55 ? "0 0% 10%" : "0 0% 98%",
            "--whatsapp": whatsappVar,
            "--whatsapp-foreground": whatsappHsl.l > 55 ? "0 0% 10%" : "0 0% 98%",
            "--sale": saleVar,
            "--sale-foreground": saleHsl.l > 55 ? "0 0% 10%" : "0 0% 98%",
          } as React.CSSProperties
        }
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SessionProvider>
            <SettingsProvider>
              <LocaleProvider>
                <CartProvider>
                  {children}
                  <AiChatButton />
                  <WhatsAppFab />
                  <ScrollToTop />
                  <Toaster />
                  <StructuredData />
                </CartProvider>
              </LocaleProvider>
            </SettingsProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
