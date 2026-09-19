"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { ProductCard } from "@/components/product-card"

interface RecProduct {
  id: string
  name: string
  description: string
  image: string
  unitQuantity?: number
  unitMeasure?: string
  price: number
  oldPrice?: number
}

export function ProductRecommendations({
  productId,
  categoryId,
}: {
  productId?: string
  categoryId?: string
}) {
  const [products, setProducts] = useState<RecProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId && !categoryId) return
    const ctrl = new AbortController()
    fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, categoryId, limit: 8 }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data.products) ? data.products : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [productId, categoryId])

  if (!loading && products.length === 0) return null

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl text-balance">
              Recomendados para você
            </h2>
            <p className="text-sm text-muted-foreground">Sugestões de produtos semelhantes, selecionadas pela IA.</p>
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
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
