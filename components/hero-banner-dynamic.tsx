"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/components/providers/settings-provider"

const DEFAULT_HERO = {
  heroTitle: "Embalagens e descartáveis com o melhor preço",
  heroSubtitle: "Tudo que você precisa para o seu negócio.",
}

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl: string
  sortOrder: number
}

export function HeroBannerDynamic() {
  const [heroTitle, setHeroTitle] = useState(DEFAULT_HERO.heroTitle)
  const [heroSubtitle, setHeroSubtitle] = useState(DEFAULT_HERO.heroSubtitle)
  const [banners, setBanners] = useState<Banner[]>([])
  const [activeBanner, setActiveBanner] = useState(0)

  // Lê settings do contexto global — sem fetch duplicado
  const {
    whatsappNumber,
    siteName,
    ctaPrimaryText,
    ctaSecondaryText,
    ctaSecondaryUrl,
    heroWhatsappText,
    heroCarouselEnabled,
  } = useSettings()

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then((data) => {
        if (data.heroTitle) setHeroTitle(data.heroTitle)
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!heroCarouselEnabled) return
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) => a.sortOrder - b.sortOrder)
          setBanners(sorted)
          setActiveBanner(0)
        }
      })
      .catch(() => setBanners([]))
  }, [heroCarouselEnabled])

  useEffect(() => {
    if (!heroCarouselEnabled || banners.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length)
    }, 6000)
    return () => window.clearInterval(interval)
  }, [heroCarouselEnabled, banners.length])

  const whatsappMessage = encodeURIComponent(heroWhatsappText.replaceAll("{siteName}", siteName))
  const active = banners[activeBanner]

  return (
    <section className="relative overflow-hidden bg-primary">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-card" />
        <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-card" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold leading-tight text-primary-foreground md:text-5xl text-balance transition-all duration-500">
            {heroTitle}
          </h2>
          <p className="mt-4 text-base text-primary-foreground/80 md:text-lg leading-relaxed transition-all duration-500">
            {heroSubtitle}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full max-w-[260px] items-center justify-center gap-2 rounded-lg bg-whatsapp px-6 py-3 text-sm font-semibold text-whatsapp-foreground transition duration-300 hover:opacity-90 active:scale-95 sm:w-auto"
            >
              <MessageCircle className="h-5 w-5" />
              {ctaPrimaryText}
            </a>
            <a
              href={ctaSecondaryUrl}
              className="flex w-full max-w-[260px] items-center justify-center gap-2 rounded-lg border-2 border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition duration-300 hover:bg-primary-foreground/10 active:scale-95 sm:w-auto"
            >
              <ArrowDown className="h-4 w-4" />
              {ctaSecondaryText}
            </a>
          </div>
        </div>

        {heroCarouselEnabled && active ? (
          <div className="mx-auto mt-10 max-w-4xl rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-xl transition-all duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary-foreground/60">
                  Carrossel de banners
                </p>
                <h3 className="mt-2 text-xl font-semibold text-primary-foreground">{active.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveBanner((prev) => (prev - 1 + banners.length) % banners.length)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveBanner((prev) => (prev + 1) % banners.length)}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <a
              href={active.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block overflow-hidden rounded-[1.5rem] border border-white/10 shadow-lg transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative h-[320px] w-full">
                <Image
                  src={active.imageUrl}
                  alt={active.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  unoptimized={active.imageUrl.startsWith("http")}
                />
              </div>
            </a>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <a
                href={active.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary-foreground px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary-foreground/90"
              >
                Ver agora
              </a>
              <span className="text-xs uppercase tracking-[0.3em] text-primary-foreground/70">
                {activeBanner + 1}/{banners.length}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
