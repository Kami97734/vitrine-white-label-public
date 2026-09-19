"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  LayoutGrid,
  Package,
  Settings,
  Home,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface HealthPayload {
  ok: boolean
  summary?: { issueCount: number; issues: string[] }
  emptyCategories?: { id: string; title: string; slug: string }[]
  placeholderCount?: number
  productsWithoutPrice?: number
  bannersCount?: number
  homeContentKeyCount?: number
  missingHomeKeys?: string[]
  homeSectionCount?: number
  seoLooksGeneric?: boolean
  seoBaseUrl?: string | null
  orderCount?: number
  error?: string
}

function IssueRow({
  ok,
  label,
  detail,
  href,
  linkLabel,
}: {
  ok: boolean
  label: string
  detail: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {ok ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
        )}
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
      </div>
      {href && (
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-1">
          <Link href={href}>
            {linkLabel ?? "Abrir"}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  )
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/health", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setData(j)
      })
      .catch(() => {
        if (!cancelled) setData({ ok: false, error: "Falha na rede" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Saúde do catálogo</h1>
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    )
  }

  if (!data?.ok && data?.error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Saúde do catálogo</h1>
        <p className="text-destructive">{data.error}</p>
      </div>
    )
  }

  const emptyCats = data?.emptyCategories ?? []
  const issueCount = data?.summary?.issueCount ?? 0

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Saúde do catálogo
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Checklist rápido da vitrine: resolva os itens em alerta para melhorar SEO, conversão e
          consistência dos dados.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant={issueCount === 0 ? "default" : "secondary"}>
            {issueCount === 0 ? "Tudo certo" : `${issueCount} ponto(s) de atenção`}
          </Badge>
          {typeof data?.orderCount === "number" && (
            <Badge variant="outline">Pedidos no banco: {data.orderCount}</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações rápidas</CardTitle>
          <CardDescription>Atalhos para as telas mais usadas na correção.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/products">
              <Package className="h-4 w-4 mr-1.5" />
              Produtos
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/categories">
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Categorias
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/banners">
              <ImageIcon className="h-4 w-4 mr-1.5" />
              Banners
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/home">
              <Home className="h-4 w-4 mr-1.5" />
              Página inicial
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/settings">
              <Settings className="h-4 w-4 mr-1.5" />
              Configurações / SEO
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Checklist</h2>

        <IssueRow
          ok={emptyCats.length === 0}
          label="Categorias sem produtos"
          detail={
            emptyCats.length === 0
              ? "Nenhuma categoria vazia."
              : `${emptyCats.length} categoria(s) sem itens.`
          }
          href="/admin/categories"
          linkLabel="Categorias"
        />

        <IssueRow
          ok={(data?.placeholderCount ?? 0) === 0}
          label="Imagens placeholder"
          detail={
            (data?.placeholderCount ?? 0) === 0
              ? "Nenhum produto usando imagem placeholder."
              : `${data?.placeholderCount} produto(s) com /images/placeholder.jpg.`
          }
          href="/admin/products"
          linkLabel="Produtos"
        />

        <IssueRow
          ok={(data?.productsWithoutPrice ?? 0) === 0}
          label="Produtos sem preço"
          detail={
            (data?.productsWithoutPrice ?? 0) === 0
              ? "Todos os produtos têm pelo menos um preço."
              : `${data?.productsWithoutPrice} produto(s) sem registro de preço.`
          }
          href="/admin/prices"
          linkLabel="Preços rápidos"
        />

        <IssueRow
          ok={(data?.bannersCount ?? 0) > 0}
          label="Banners na home"
          detail={
            (data?.bannersCount ?? 0) > 0
              ? `${data?.bannersCount} banner(s) cadastrado(s).`
              : "Nenhum banner — a faixa superior da home fica vazia."
          }
          href="/admin/banners"
          linkLabel="Banners"
        />

        <IssueRow
          ok={!data?.seoLooksGeneric}
          label="URL base do site (SEO)"
          detail={
            data?.seoLooksGeneric
              ? `Configure um domínio real em vez de "${data?.seoBaseUrl ?? "example.com"}".`
              : "URL base parece configurada."
          }
          href="/admin/settings"
          linkLabel="SEO"
        />

        <IssueRow
          ok={(data?.missingHomeKeys?.length ?? 0) === 0}
          label="Chaves de conteúdo da home (HomeContent)"
          detail={
            (data?.missingHomeKeys?.length ?? 0) === 0
              ? `Todas as chaves esperadas presentes (${data?.homeContentKeyCount ?? 0} no banco).`
              : `Faltando: ${(data?.missingHomeKeys ?? []).join(", ")}`
          }
          href="/admin/home"
          linkLabel="Textos da home"
        />

        <IssueRow
          ok
          label="Blocos extras (HomeSection) — opcional"
          detail={
            (data?.homeSectionCount ?? 0) > 0
              ? `${data?.homeSectionCount} bloco(s) cadastrado(s).`
              : "Nenhum bloco; a home pode usar só textos e banners."
          }
          href="/admin/home"
          linkLabel="Página inicial"
        />
      </div>

      {emptyCats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Categorias vazias
            </CardTitle>
            <CardDescription>Associe produtos ou remova categorias não usadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border rounded-md border border-border">
              {emptyCats.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-foreground">{c.title}</span>
                  <span className="text-xs text-muted-foreground font-mono">{c.slug}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
