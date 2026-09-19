"use client"

import { useEffect, useState, useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, ChevronRight, Home } from "lucide-react"
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AdminSidebar } from "./admin-sidebar"
import { useSettings } from "@/components/providers/settings-provider"
import { useLocale } from "@/components/providers/locale-provider"

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Produtos",
  "/admin/categories": "Categorias",
  "/admin/banners": "Banners",
  "/admin/promo": "Ofertas",
  "/admin/orders": "Pedidos",
  "/admin/home": "Página inicial",
  "/admin/menu": "Menu",
  "/admin/prices": "Preços por código",
  "/admin/prices/bulk": "Preços em lote",
  "/admin/import": "Importar",
  "/admin/media": "Mídia",
  "/admin/settings": "Configurações",
  "/admin/coupons": "Cupons",
  "/admin/ai": "Inteligência Artificial",
  "/admin/logs": "Logs",
  "/admin/health": "Saúde do catálogo",
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/admin/login" || pathname.startsWith("/admin/setup")
  const { theme, setTheme } = useTheme()
  const settings = useSettings()
  const { t } = useLocale()
  const [mounted, setMounted] = useState(false)

  const breadcrumbs = useMemo(() => {
    const parts: { href: string; label: string }[] = []
    const segments = pathname.split("/").filter(Boolean)
    let accum = ""
    for (const seg of segments) {
      accum += `/${seg}`
      const label = BREADCRUMB_MAP[accum]
      if (label) parts.push({ href: accum, label })
    }
    return parts
  }, [pathname])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen md:flex md:flex-row bg-background">
        <Sidebar>
          <AdminSidebar />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b bg-background px-4 sm:px-6 md:px-8">
            <SidebarTrigger className="md:hidden" />
            <nav className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
              </Link>
              {breadcrumbs.length > 1 && breadcrumbs.slice(1).map((crumb, i, arr) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5" />
                  {i === arr.length - 1 ? (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
            <div className="hidden sm:flex flex-col ml-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {settings.adminPanelTitle || t("admin.header.title")}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {settings.adminPanelSubtitle || t("admin.header.subtitle")}
              </span>
            </div>
            <button
              type="button"
              className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-foreground transition hover:bg-muted"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t("admin.header.toggleTheme")}
            >
              {mounted ? (theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : <Moon className="h-5 w-5" />}
            </button>
          </header>
          <div className="min-h-[calc(100vh-3.5rem)] px-3 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
