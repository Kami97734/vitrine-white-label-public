"use client"

import Image from "next/image"
import { Package, Phone, Menu, X, LogOut, Search, Moon, Sun } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useTheme } from "next-themes"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSettings } from "@/components/providers/settings-provider"
import { CartDrawer } from "@/components/cart/cart-drawer"

function HeaderInner() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuItems, setMenuItems] = useState<
    { id: string; label: string; slugOrUrl: string; position: string; visible: boolean }[]
  >([])
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQ = searchParams.get("q") ?? ""

  // Lê configurações do contexto global (uma única chamada a /api/settings)
  const settings = useSettings()
  const { siteName, whatsappNumber, city, logoUrl, ctaPrimaryText, fabWhatsappText } = settings

  const whatsappMessage = encodeURIComponent(
    fabWhatsappText.replaceAll("{siteName}", siteName)
  )

  useEffect(() => {
    setSearchQuery(currentQ)
  }, [currentQ])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filtered = data.filter(
            (i: any) => i.visible && (i.position === "header" || i.position === "both")
          )
          filtered.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          setMenuItems(
            filtered.map((i: any) => ({
              id: i.id,
              label: String(i.label ?? "").trim() || "Item",
              slugOrUrl: String(i.slugOrUrl ?? "/").trim() || "/",
              position: String(i.position ?? "header"),
              visible: Boolean(i.visible ?? true),
            }))
          )
        }
      })
      .catch(() => {
        // se falhar, mantemos os anchors padrão
      })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      router.push("/?q=" + encodeURIComponent(q) + "#catalogo")
    } else {
      router.push("/")
    }
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover border border-border"
              unoptimized={logoUrl.startsWith("http")}
            />
          ) : (
            <div className="flex items-center justify-center rounded-lg bg-primary p-2">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground">
              {siteName}
            </h1>
            <p className="text-xs text-muted-foreground leading-none">
              {city}
            </p>
          </div>
        </Link>

        {/* Busca — visível apenas em md+ */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 min-w-0 max-w-xs mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 bg-muted/50"
              aria-label="Buscar produtos"
            />
          </div>
          <Button type="submit" size="sm" className="ml-1 h-9 shrink-0">
            Buscar
          </Button>
        </form>

        <nav className="hidden md:flex items-center gap-5">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.slugOrUrl}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))
          ) : (
            <>
              <a href="#ofertas" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Ofertas</a>
              <a href="#embalagens" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Embalagens</a>
              <a href="#sorveteria" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Sorveteria</a>
              <a href="#papelaria" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Papelaria</a>
              <a href="#festas" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Festas</a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* Ícone de busca visível somente em mobile (abre menu com busca) */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen((current) => !current)
              setMobileMenuOpen(false)
            }}
            className="md:hidden flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
            aria-label="Abrir busca"
            aria-expanded={mobileSearchOpen}
            aria-controls="mobile-search"
          >
            <Search className="h-5 w-5" />
          </button>

          {status === "loading" ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session.user.name?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name ?? "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
          )}

          {settings.cartEnabled && (
            <div className="inline-flex">
              <CartDrawer />
            </div>
          )}

          {/* Toggle dark mode — visível em sm+ */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="hidden sm:inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 text-foreground transition hover:bg-muted"
            aria-label="Alternar modo escuro"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-semibold text-whatsapp-foreground transition-all hover:opacity-90 active:scale-95"
          >
            <Phone className="h-4 w-4" />
            {ctaPrimaryText}
          </a>

          <button
            onClick={() => {
              setMobileMenuOpen((current) => !current)
              setMobileSearchOpen(false)
            }}
            className="md:hidden flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div id="mobile-search" className="md:hidden border-t border-border bg-card px-4 py-3 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-muted/50"
                aria-label="Buscar produtos"
                autoFocus
              />
            </div>
            <Button type="submit" size="sm" className="h-9 shrink-0">
              Buscar
            </Button>
          </form>
        </div>
      )}

      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-border bg-card max-h-[80dvh] overflow-y-auto">
          {/* Busca no menu mobile */}
          <form onSubmit={handleSearch} className="mx-auto max-w-7xl px-4 pt-3 pb-2 sm:px-6 lg:px-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 bg-muted/50"
                  aria-label="Buscar produtos"
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" className="h-9 shrink-0">
                Buscar
              </Button>
            </div>
          </form>

          <nav className="mx-auto max-w-7xl px-4 py-2 flex flex-col gap-1">
            {menuItems.length > 0
              ? menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.slugOrUrl}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </Link>
                ))
              : (
                  <>
                    <a href="#ofertas" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Ofertas</a>
                    <a href="#embalagens" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Embalagens</a>
                    <a href="#sorveteria" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Sorveteria</a>
                    <a href="#papelaria" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Papelaria</a>
                    <a href="#festas" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Festas</a>
                  </>
                )}

            {!session && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground bg-muted"
              >
                Entrar
              </Link>
            )}

            {/* Toggle dark mode no menu mobile (fix #2) */}
            <button
              type="button"
              onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
                setMobileMenuOpen(false)
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
              aria-label="Alternar modo escuro"
            >
              {mounted && resolvedTheme === "dark" ? (
                <><Sun className="h-4 w-4" /> Modo Claro</>
              ) : (
                <><Moon className="h-4 w-4" /> Modo Escuro</>
              )}
            </button>

            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-semibold text-whatsapp-foreground transition-all hover:opacity-90"
            >
              <Phone className="h-4 w-4" />
              {ctaPrimaryText}
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}

export function Header() {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <HeaderInner />
    </Suspense>
  )
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-1">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-9 w-72 bg-muted animate-pulse rounded hidden md:block" />
        <div className="h-9 w-9 bg-muted animate-pulse rounded" />
      </div>
    </header>
  )
}
