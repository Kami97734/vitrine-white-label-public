import { Suspense } from "react"
import { Header } from "@/components/header"
import { HeroBannerDynamic } from "@/components/hero-banner-dynamic"
import { HomeBanners } from "@/components/home-banners"
import { PromoSection } from "@/components/promo-section"
import { CatalogSection } from "@/components/catalog-section"
import { HomeDynamicSections } from "@/components/home-dynamic-sections"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="h-14 bg-card border-b border-border" />}>
        <Header />
      </Suspense>
      <main>
        <HeroBannerDynamic />
        <HomeBanners />
        <HomeDynamicSections />
        <PromoSection />
        <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Carregando catalogo...</div>}>
          <CatalogSection />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
