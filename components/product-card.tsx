"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, memo } from "react"
import { MessageCircle, Eye, ShoppingCart } from "lucide-react"
import { useSettings } from "@/components/providers/settings-provider"
import { useCart } from "@/lib/cart-context"

interface Product {
  id: string
  name: string
  description: string
  image: string
  oldPrice?: number
  price: number
  unitQuantity?: number
  unitMeasure?: string
  stock?: number
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export const ProductCard = memo(function ProductCard({
  product,
  isPromo = false,
}: {
  product: Product
  isPromo?: boolean
}) {
  const { whatsappNumber, cartEnabled } = useSettings()
  const { addItem } = useCart()
  const [imgSrc, setImgSrc] = useState(product.image || "/placeholder-product.svg")

  const whatsappMessage = encodeURIComponent(
    `Olá, gostaria de saber mais sobre o produto "${product.name}" (${product.unitQuantity ?? 1} ${product.unitMeasure ?? "un"}) que vi no site.`
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {isPromo && discount && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-sale px-2 py-0.5 text-xs font-bold text-sale-foreground">
          {`-${discount}%`}
        </span>
      )}
      {product.stock !== undefined && product.stock >= 0 && (
        <span
          className={`absolute right-2 top-2 z-10 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
            product.stock === 0
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : product.stock <= 5
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-green-500/20 text-green-400 border border-green-500/30"
          }`}
        >
          {product.stock === 0 ? "Fora de estoque" : `Estoque: ${product.stock}`}
        </span>
      )}

      <Link href={`/produto/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%23f3f4f6'/%3E%3C/svg%3E"
            onError={() => setImgSrc("/placeholder-product.svg")}
            unoptimized={imgSrc.startsWith("http")}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        <Link href={`/produto/${product.id}`} className="hover:underline">
          <h3 className="text-sm font-semibold leading-snug text-card-foreground md:text-base">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}

        {(product.unitQuantity || product.unitMeasure) && (
          <p className="text-xs font-medium text-muted-foreground">
            {product.unitQuantity ?? 1} {product.unitMeasure ?? "un"}
          </p>
        )}

        <div className="mt-auto pt-2">
          {product.oldPrice && product.oldPrice > product.price ? (
            <div className="flex flex-col">
              <span className="text-sm text-sale line-through decoration-sale/70">
                {formatPrice(product.oldPrice)}
              </span>
              <span className="text-lg font-bold text-primary md:text-xl">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-primary md:text-xl">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-1">
          {cartEnabled && (
            <button
              onClick={() =>
                addItem({
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                })
              }
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 md:text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              Adicionar
            </button>
          )}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-whatsapp px-3 py-2.5 text-xs font-semibold text-whatsapp-foreground transition-all hover:opacity-90 active:scale-95 md:text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <Link
            href={`/produto/${product.id}`}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
            aria-label={`Ver detalhes de ${product.name}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
})
