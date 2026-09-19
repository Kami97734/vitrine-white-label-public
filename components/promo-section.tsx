"use client"

import { useEffect, useState } from "react"
import { Flame } from "lucide-react"
import { ProductCard } from "./product-card"
import { useSettings } from "@/components/providers/settings-provider"

interface PromoProduct {
  id: string
  name: string
  description: string
  image: string
  unitQuantity?: number
  unitMeasure?: string
  price: number
  oldPrice?: number
}

export function PromoSection() {
  const [products, setProducts] = useState<PromoProduct[]>([])
  const [loading, setLoading] = useState(true)

  // Lê settings do contexto global (fix #14)
  const { promoSectionTitle, promoSectionSubtitle } = useSettings()

  useEffect(() => {
    fetch("/api/promo-products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  // fix #15: oculta a seção inteira se não houver produtos e não estiver carregando
  if (!loading && products.length === 0) return null

  return (
    <section id="ofertas" className="py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-sale p-2">
            <Flame className="h-5 w-5 text-sale-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl text-balance">
              {promoSectionTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{promoSectionSubtitle}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} isPromo />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
