"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, MessageCircle, Tag, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductRecommendations } from "@/components/product-recommendations"
import { useCart } from "@/lib/cart-context"
import { useSettings } from "@/components/providers/settings-provider"

interface ProductData {
  id: string
  name: string
  description: string
  image: string
  images: string[]
  code: string | null
  price: number
  oldPrice: number | null
  stock?: number
  unitQuantity?: number
  category: { id: string; title: string; slug: string } | null
}

interface ProductPageClientProps {
  product: ProductData
  settings: {
    whatsappNumber: string
    siteName: string
  }
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProductPageClient({ product, settings }: ProductPageClientProps) {
  const { addItem } = useCart()
  const { cartEnabled } = useSettings()
  const allImages = [product.image, ...product.images].filter(Boolean)
  const [activeImg, setActiveImg] = useState(0)
  const [imgSrc, setImgSrc] = useState(allImages[0] || "/placeholder-product.svg")

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null

  const whatsappMessage = encodeURIComponent(
    `Olá! Gostaria de saber mais sobre o produto "${product.name}" e fazer um pedido.`
  )
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${whatsappMessage}`

  function handlePrev() {
    const next = (activeImg - 1 + allImages.length) % allImages.length
    setActiveImg(next)
    setImgSrc(allImages[next])
  }

  function handleNext() {
    const next = (activeImg + 1) % allImages.length
    setActiveImg(next)
    setImgSrc(allImages[next])
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                href={`/#${product.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.title}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Galeria de imagens */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted border border-border">
              <Image
                src={imgSrc}
                alt={product.name}
                fill
                className="object-cover transition-all duration-300"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized={imgSrc.startsWith("http")}
                onError={() => setImgSrc("/placeholder-product.svg")}
              />
              {discount && (
                <span className="absolute left-3 top-3 rounded-lg bg-sale px-3 py-1 text-sm font-bold text-sale-foreground">
                  -{discount}%
                </span>
              )}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-md transition hover:bg-background"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-md transition hover:bg-background"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setActiveImg(idx); setImgSrc(img) }}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      idx === activeImg ? "border-primary" : "border-border hover:border-primary/40"
                    }`}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} foto ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized={img.startsWith("http")}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do produto */}
          <div className="flex flex-col gap-5">
            {product.category && (
              <Badge variant="secondary" className="w-fit gap-1">
                <Tag className="h-3 w-3" />
                {product.category.title}
              </Badge>
            )}

            <div>
              <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
                {product.name}
              </h1>
              {product.code && (
                <p className="mt-1 text-xs text-muted-foreground font-mono">
                  Código: {product.code}
                </p>
              )}
            </div>

            {/* Preço */}
            <div className="rounded-xl bg-muted/50 p-4 border border-border">
              {product.oldPrice && product.oldPrice > product.price ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground line-through">
                    De {formatPrice(product.oldPrice)}
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </p>
                  <p className="text-sm font-semibold text-sale">
                    Economia de {formatPrice(product.oldPrice - product.price)} ({discount}% off)
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
              )}
            </div>

            {/* Descrição */}
            {product.description && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-foreground uppercase tracking-wide">
                  Descrição
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Estoque */}
            {product.stock !== undefined && product.stock >= 0 && (
              <div className={`rounded-lg border px-3 py-2 text-sm ${
                product.stock === 0
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : product.stock <= 5
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-green-500/30 bg-green-500/10 text-green-400"
              }`}>
                {product.stock === 0
                  ? "Fora de estoque"
                  : `Estoque: ${product.stock} unidade${product.stock !== 1 ? "s" : ""}`}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-2">
              {cartEnabled && (
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() =>
                    addItem({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                    })
                  }
                >
                  <ShoppingCart className="h-5 w-5" />
                  Adicionar ao carrinho
                </Button>
              )}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-4 text-base font-semibold text-whatsapp-foreground transition-all hover:opacity-90 active:scale-95"
              >
                <MessageCircle className="h-5 w-5" />
                Pedir este produto pelo WhatsApp
              </a>

              <Button asChild variant="outline" className="gap-2">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao catálogo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <ProductRecommendations productId={product.id} categoryId={product.category?.id} />
      <Footer />
    </div>
  )
}
