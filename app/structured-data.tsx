import { prisma } from "@/lib/prisma"

async function loadSettings() {
  try {
    return await prisma.siteSettings.findFirst()
  } catch {
    return null
  }
}

export async function StructuredData() {
  const settings = await loadSettings()

  const siteName = settings?.siteName ?? "Catálogo de Produtos"
  const city = settings?.city ?? "Sua cidade"
  const phone = settings?.phoneDisplay ?? ""

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteName,
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressCountry: "BR",
    },
    telephone: phone || undefined,
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

