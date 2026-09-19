"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ProductCard } from "./product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { X, RefreshCw, AlertTriangle } from "lucide-react"

interface CatalogProduct {
  id: string
  name: string
  description: string
  image: string
  price: number
  oldPrice?: number
}

interface CategoryFromApi {
  id: string
  slug: string
  title: string
  products: CatalogProduct[]
}

export function CatalogSection() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchQuery = (searchParams.get("q") ?? "").trim().toLowerCase()
  const activeCategory = searchParams.get("cat") ?? ""

  const [categories, setCategories] = useState<CategoryFromApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filteredCategories = useMemo(() => {
    let cats = categories

    if (activeCategory) {
      cats = cats.filter((c) => c.slug === activeCategory)
    }

    if (!searchQuery) return cats
    return cats
      .map((cat) => ({
        ...cat,
        products: cat.products.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery) ||
            (p.description?.toLowerCase().includes(searchQuery) ?? false)
        ),
      }))
      .filter((cat) => cat.products.length > 0)
  }, [categories, searchQuery, activeCategory])

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Falha ao carregar categorias")
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error("Resposta invalida do servidor")
      setCategories(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar catalogo")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  function setCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set("cat", slug)
    } else {
      params.delete("cat")
    }
    router.push(`/?${params.toString()}#embalagens`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="space-y-12 md:space-y-16">
        {[1, 2, 3].map((i) => (
          <section key={i} className="py-2">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-6 flex items-center gap-3">
                <Skeleton className="h-8 w-1 rounded-full" />
                <Skeleton className="h-8 w-48" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="aspect-square rounded-xl" />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nao foi possivel carregar o catalogo
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Ocorreu um erro ao buscar os produtos. Tente novamente ou volte mais tarde.
        </p>
        <button
          onClick={fetchCategories}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Catalogo vazio
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Nenhum produto cadastrado ainda. Volte em breve para conferir nossas novidades!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12 md:space-y-16" id="embalagens">
      {categories.length > 1 && (
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                !activeCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                  activeCategory === cat.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {cat.title}
                {activeCategory === cat.slug && (
                  <X className="h-3 w-3 ml-0.5 opacity-70" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredCategories.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? `Nenhum produto encontrado para "${searchQuery}".`
              : "Nenhum produto nesta categoria."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? "Tente outro termo ou limpe a busca." : ""}
          </p>
        </div>
      ) : (
        filteredCategories.map((category) => (
          <section
            key={category.id}
            id={category.slug}
            className="py-2"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-primary shrink-0" />
                  <h2 className="text-xl font-bold text-foreground md:text-2xl">
                    {category.title}
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({category.products.length} {category.products.length === 1 ? "produto" : "produtos"})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  )
}
