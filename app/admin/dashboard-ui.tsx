"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteStatusCard } from "@/components/admin/site-status-card"
import {
  Package, FolderTree, Image, LayoutDashboard, Clock3, ShoppingBag, Home, Settings,
  TrendingUp, AlertTriangle, FileUp, BarChart3, ListFilter, Users, MapPin,
} from "lucide-react"

type PriceAvgByCategoryRow = { category: string; avgPrice: number; productCount: number }
type PriceChangesByDayRow = { date: string; label: string; count: number }
type ProductsByCategoryRow = { category: string; count: number }
type Log24hRow = { result: string; count: number }
type RecentFailureRow = { id: string; action: string; result: string | null; details: string | null; path: string | null; createdAt: string }
type AdminActivityItem = { id: string; action: string; adminEmail: string | null; details: string | null; ip: string | null; path: string | null; createdAt: string }

type DashboardPayload = {
  ok: boolean
  metrics: {
    productsCount: number; categoriesCount: number; bannersCount: number
    placeholderCount: number; emptyCategoriesCount: number; homeCount: number
    productsWithoutPrice: number; ordersCount: number; healthIssueCount: number
  }
  settings: { heroCarouselEnabled: boolean }
  charts: {
    priceAvgByCategory: PriceAvgByCategoryRow[]
    priceChangesByDay: PriceChangesByDayRow[]
    productsByCategory: ProductsByCategoryRow[]
  }
  logs24h: Log24hRow[]
  recentFailures: RecentFailureRow[]
  activity: AdminActivityItem[]
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function AdminDashboardUI() {
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<AdminActivityItem[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const dashRes = await fetch("/api/admin/dashboard", { credentials: "include" })
        const dashJson = (await dashRes.json()) as DashboardPayload
        if (!dashRes.ok) throw new Error((dashJson as any).error ?? "Erro ao carregar dashboard")
        if (!cancelled) {
          setData(dashJson)
          setActivity(Array.isArray(dashJson.activity) ? dashJson.activity : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const overallAvgPrice = useMemo(() => {
    if (!data) return 0
    const rows = data.charts.priceAvgByCategory
    const totalProducts = rows.reduce((acc, r) => acc + r.productCount, 0)
    if (!totalProducts) return 0
    const sum = rows.reduce((acc, r) => acc + r.avgPrice * r.productCount, 0)
    return sum / totalProducts
  }, [data])

  const chartAvgConfig = useMemo(() => ({
    avgPrice: { label: "Preço médio", color: "#0c87b8" },
  }), [])
  const chartChangesConfig = useMemo(() => ({
    count: { label: "Mudanças", color: "#f97316" },
  }), [])
  const chartPieConfig = useMemo(() => ({
    count: { label: "Produtos", color: "#0c87b8" },
  }), [])
  const PIE_COLORS = ["#0c87b8", "#f97316", "#22c55e", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308"]

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <LayoutDashboard className="h-4 w-4" />
          <span>Painel administrativo</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Visão geral da loja
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Acompanhe rapidamente como est&aacute; o seu cat&aacute;logo e acesse as telas principais em poucos cliques.
        </p>
      </div>

      <SiteStatusCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Package className="h-5 w-5 text-blue-600" />}
          title="Produtos"
          value={data?.metrics.productsCount ?? 0}
          loading={loading}
          linkHref="/admin/products"
          linkLabel="Gerenciar"
          gradient="from-blue-500/10 to-blue-600/5"
        />
        <KpiCard
          icon={<FolderTree className="h-5 w-5 text-violet-600" />}
          title="Categorias"
          value={data?.metrics.categoriesCount ?? 0}
          loading={loading}
          linkHref="/admin/categories"
          linkLabel="Gerenciar"
          gradient="from-violet-500/10 to-violet-600/5"
        />
        <KpiCard
          icon={<Image className="h-5 w-5 text-emerald-600" />}
          title="Banners"
          value={data?.metrics.bannersCount ?? 0}
          loading={loading}
          linkHref="/admin/banners"
          linkLabel="Gerenciar"
          gradient="from-emerald-500/10 to-emerald-600/5"
        />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          title="Alertas de sade"
          value={data?.metrics.healthIssueCount ?? 0}
          loading={loading}
          linkHref="/admin/health"
          linkLabel="Ver checklist"
          gradient="from-orange-500/10 to-orange-600/5"
          subtitle={
            data
              ? `${data.metrics.placeholderCount} placeholder · ${data.metrics.productsWithoutPrice} sem preço`
              : "—"
          }
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Atalhos r&aacute;pidos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
            <Link href="/admin/banners"><Image className="h-3.5 w-3.5" />Banners</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
            <Link href="/admin/promo"><TrendingUp className="h-3.5 w-3.5" />Ofertas</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
            <Link href="/admin/home"><Home className="h-3.5 w-3.5" />P&aacute;gina inicial</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
            <Link href="/admin/logs"><ListFilter className="h-3.5 w-3.5" />Logs</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
            <Link href="/admin/import"><FileUp className="h-3.5 w-3.5" />Importa&ccedil;&atilde;o</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
            <Link href="/admin/prices"><MapPin className="h-3.5 w-3.5" />Pre&ccedil;os r&aacute;pidos</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
            <Link href="/admin/media"><Image className="h-3.5 w-3.5" />M&iacute;dia</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
            <Link href="/admin/settings"><Settings className="h-3.5 w-3.5" />Configurar</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6 min-w-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Preço mdio por categoria</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto min-w-0">
                {loading ? (
                  <Skeleton className="h-[280px] w-full min-w-[280px]" />
                ) : data?.charts.priceAvgByCategory?.length ? (
                  <ChartContainer id="price-avg" config={chartAvgConfig} className="h-[280px] w-full min-w-[320px] [&_.recharts-cartesian-axis-tick_text]:text-muted-foreground">
                    <BarChart data={data.charts.priceAvgByCategory} margin={{ left: 6, right: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tickLine={false} axisLine={false} minTickGap={20} />
                      <YAxis tickFormatter={(v) => formatBRL(v)} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel hideIndicator indicator="dot" />} />
                      <Bar dataKey="avgPrice" fill="var(--color-avgPrice)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados suficientes para o gr&aacute;fico.</p>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Mudanas de preço (ltimos 7 dias)</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto min-w-0">
                {loading ? (
                  <Skeleton className="h-[280px] w-full min-w-[280px]" />
                ) : data ? (
                  <ChartContainer id="price-changes" config={chartChangesConfig} className="h-[280px] w-full min-w-[300px]">
                    <LineChart data={data.charts.priceChangesByDay} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel indicator="line" />} />
                      <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Produtos por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : data?.charts.productsByCategory?.some((r) => r.count > 0) ? (
                  <div className="w-full overflow-x-auto">
                    <ChartContainer id="products-pie" config={chartPieConfig} className="mx-auto h-[280px] w-full min-w-[280px] [&_.recharts-pie-label-text]:fill-muted-foreground">
                      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <Pie
                          data={data.charts.productsByCategory.filter((r) => r.count > 0)}
                          dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100}
                          label={({ category, percent }) =>
                            `${String(category).slice(0, 12)}${String(category).length > 12 ? "…" : ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {data.charts.productsByCategory.filter((r) => r.count > 0).map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      </PieChart>
                    </ChartContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem produtos no cat&aacute;logo.</p>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Logs (ltimas 24h)</CardTitle>
                <p className="text-xs text-muted-foreground">Eventos agrupados por resultado.</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[120px] w-full" />
                ) : data?.logs24h?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {data.logs24h.map((row) => (
                      <Badge key={row.result} variant="outline" className="font-mono text-xs">
                        {row.result ?? "—"}: {row.count}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum log nas &uacute;ltimas 24 horas.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Atividade recente</CardTitle>
                <p className="text-xs text-muted-foreground">&Uacute;ltimas a&ccedil;&otilde;es registradas no painel.</p>
              </div>
              <Clock3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : activity.length ? (
                <div className="space-y-3">
                  {activity.slice(0, 7).map((log) => {
                    let details: string | null = log.details
                    try {
                      if (log.details) details = JSON.stringify(JSON.parse(log.details), null, 0)
                    } catch { /* keep as text */ }
                    const dt = new Date(log.createdAt)
                    return (
                      <div key={log.id} className="flex flex-col gap-3 rounded-md border bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-foreground">{log.action}</p>
                          {details && <p className="text-xs text-muted-foreground line-clamp-2">{details}</p>}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            {log.path && <span>{log.path}</span>}
                            <span>&bull;</span>
                            <span>{dt.toLocaleDateString("pt-BR")} &agrave;s {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma a&ccedil;&atilde;o registrada ainda.</p>
              )}
              <div className="mt-4">
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link href="/admin/logs">Ver todos os logs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Estado do cat&aacute;logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : data ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Badge variant="outline" className="gap-1.5 py-2 justify-start">
                      <Package className="h-3.5 w-3.5 text-blue-500" />
                      <div>
                        <p className="font-medium">{data.metrics.productsCount}</p>
                        <p className="text-[11px] text-muted-foreground">produtos</p>
                      </div>
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 py-2 justify-start">
                      <FolderTree className="h-3.5 w-3.5 text-violet-500" />
                      <div>
                        <p className="font-medium">{data.metrics.categoriesCount}</p>
                        <p className="text-[11px] text-muted-foreground">categorias</p>
                      </div>
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 py-2 justify-start">
                      <Image className="h-3.5 w-3.5 text-emerald-500" />
                      <div>
                        <p className="font-medium">{data.metrics.bannersCount}</p>
                        <p className="text-[11px] text-muted-foreground">banners</p>
                      </div>
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 py-2 justify-start">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <div>
                        <p className="font-medium">{formatBRL(overallAvgPrice || 0)}</p>
                        <p className="text-[11px] text-muted-foreground">pre&ccedil;o m&eacute;dio</p>
                      </div>
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="font-medium text-foreground">Pedidos (total):</span> {data.metrics.ordersCount}
                    </p>
                    <p><span className="font-medium text-foreground">Sem pre&ccedil;o:</span> {data.metrics.productsWithoutPrice}</p>
                    <p><span className="font-medium text-foreground">Placeholder images:</span> {data.metrics.placeholderCount}</p>
                    <p><span className="font-medium text-foreground">Categorias sem produtos:</span> {data.metrics.emptyCategoriesCount}</p>
                    <p><span className="font-medium text-foreground">Chaves home configuradas:</span> {data.metrics.homeCount}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                &Uacute;ltimas falhas / avisos
              </CardTitle>
              <p className="text-xs text-muted-foreground">Registros com resultado failed ou warning.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : data?.recentFailures?.length ? (
                data.recentFailures.map((f) => (
                  <div key={f.id} className="rounded-md border px-3 py-2 text-xs">
                    <p className="font-mono font-medium text-foreground">{f.action}</p>
                    <p className="text-muted-foreground">{f.result ?? "—"}</p>
                    {f.path && <p className="text-[10px] text-muted-foreground mt-1">{f.path}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma falha recente registrada.</p>
              )}
              <Button asChild variant="outline" size="sm" className="w-full mt-2">
                <Link href="/admin/logs">Ver logs completos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                A&ccedil;&otilde;es r&aacute;pidas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/import"><FileUp className="h-4 w-4" />Importar cat&aacute;logo</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/settings"><Settings className="h-4 w-4" />Configurar site</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/products"><Package className="h-4 w-4" />Produtos</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/menu"><ListFilter className="h-4 w-4" />Menu do site</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/health"><AlertTriangle className="h-4 w-4" />Sa&uacute;de do cat&aacute;logo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KpiCard(props: {
  icon: ReactNode
  title: string
  value: number
  subtitle?: string
  loading: boolean
  linkHref: string
  linkLabel: string
  gradient?: string
}) {
  return (
    <Card className={`shadow-sm relative overflow-hidden ${props.gradient ? `bg-gradient-to-br ${props.gradient}` : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {props.title}
        </CardTitle>
        {props.icon}
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-2xl font-bold">{props.value}</p>
        )}
        {props.subtitle && !props.loading && <p className="text-xs text-muted-foreground mt-1">{props.subtitle}</p>}
        <Button asChild variant="link" className="p-0 h-auto mt-2">
          <Link href={props.linkHref}>{props.linkLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
