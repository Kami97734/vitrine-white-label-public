import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await prisma.siteSettings.findFirst().catch(() => null)
  const siteName = settings?.siteName?.trim() || "Catálogo de Produtos"
  const primaryColor = settings?.primaryColor?.trim() || "#0c87b8"

  return {
    name: siteName,
    short_name: siteName,
    description: settings?.siteTagline?.trim() || "Vitrine virtual de produtos com pedidos via WhatsApp",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: primaryColor,
    icons: [
      { src: settings?.faviconUrl?.trim() || "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  }
}
