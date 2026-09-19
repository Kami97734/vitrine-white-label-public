"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/components/providers/settings-provider"

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl: string
  sortOrder: number
}

export function HomeBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Lê heroCarouselEnabled do contexto global (fix #14 — sem fetch próprio)
  const { heroCarouselEnabled } = useSettings()

  useEffect(() => {
    // Só carrega banners se o carrossel integrado ao hero estiver desligado
    if (!heroCarouselEnabled) {
      fetch("/api/banners")
        .then((r) => r.json())
        .then((data) => setBanners(Array.isArray(data) ? data.sort((a, b) => a.sortOrder - b.sortOrder) : []))
        .catch(() => setBanners([]))
    }
  }, [heroCarouselEnabled])

  useEffect(() => {
    if (!banners.length) return
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [banners.length])

  // Não renderiza se o carrossel do hero estiver ativo ou se não houver banners
  if (heroCarouselEnabled || banners.length === 0) return null

  return (
    <section className="w-full overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Cabeçalho — fix #6: cores do tema em vez de slate hardcoded */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ofertas em destaque</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Banners da vitrine</h2>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length)}
              aria-label="Banner anterior"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setActiveIndex((prev) => (prev + 1) % banners.length)}
              aria-label="Próximo banner"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Carrossel — fix #6: bg-card e border-border em vez de bg-white e border-slate-200 */}
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-full shrink-0 overflow-hidden"
              >
                {/* fix #3: altura responsiva com breakpoints (não mais fixa só em mobile) */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover transition-transform duration-500 ease-out hover:scale-105"
                    sizes="100vw"
                    unoptimized={banner.imageUrl.startsWith("http")}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-5">
                    <p className="text-sm text-white/90">{banner.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Indicadores de posição — fix #6: usa bg-primary e bg-muted-foreground/40 */}
        {banners.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ir para banner ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "bg-primary scale-110"
                    : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
