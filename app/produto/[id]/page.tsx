import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductPageClient } from "./product-page-client"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, title: true, slug: true } },
        prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
      },
    })
    return product
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: "Produto não encontrado" }

  const settings = await prisma.siteSettings.findFirst()
  const siteName = settings?.siteName ?? "Catálogo de Produtos"
  const baseUrl = settings?.seoBaseUrl?.trim() || "https://example.com"

  return {
    title: `${product.name} | ${siteName}`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      url: `${baseUrl}/produto/${id}`,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  const price = product.prices[0]?.value ?? 0
  const oldPrice = product.prices[0]?.oldValue ?? null

  let images: string[] = []
  if (product.images) {
    try {
      const parsed = JSON.parse(product.images)
      if (Array.isArray(parsed)) images = parsed
    } catch {
      images = []
    }
  }

  const settings = await prisma.siteSettings.findFirst()

  return (
    <ProductPageClient
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        images,
        code: product.code,
        price,
        oldPrice,
        stock: product.stock,
        unitQuantity: product.unitQuantity,
        category: product.category,
      }}
      settings={{
        whatsappNumber: settings?.whatsappNumber ?? "5500000000000",
        siteName: settings?.siteName ?? "Catálogo de Produtos",
      }}
    />
  )
}
