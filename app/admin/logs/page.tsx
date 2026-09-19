"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface AdminLogItem {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  result: string | null
  source: string | null
  correlationId: string | null
  adminEmail: string | null
  details: string | null
  beforeData: string | null
  afterData: string | null
  ip: string | null
  userAgent: string | null
  method: string | null
  path: string | null
  createdAt: string
}

const ACTION_HINTS = [
  { value: "__any__", label: "Qualquer ação" },
  { value: "product", label: "Produtos" },
  { value: "category", label: "Categorias" },
  { value: "banner", label: "Banners" },
  { value: "settings", label: "Configurações" },
  { value: "import", label: "Importação" },
  { value: "home", label: "Home / conteúdo" },
  { value: "upload", label: "Upload / mídia" },
  { value: "admin.login", label: "Login admin" },
  { value: "price", label: "Preços" },
  { value: "promo", label: "Promoções" },
]

function tryParseJson(s: string | null): unknown {
  if (!s?.trim()) return null
  try {
    return JSON.parse(s) as unknown
  } catch {
    return null
  }
}

function formatJsonBlock(data: unknown, rawFallback?: string | null): string {
  if (data != null && typeof data === "object") {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }
  if (rawFallback?.trim()) return rawFallback
  if (data == null) return "—"
  return String(data)
}

function simpleKeyDiff(before: unknown, after: unknown): string {
  if (
    typeof before !== "object" ||
    before === null ||
    typeof after !== "object" ||
    after === null ||
    Array.isArray(before) ||
    Array.isArray(after)
  ) {
    return ""
  }
  const b = before as Record<string, unknown>
  const a = after as Record<string, unknown>
  const keys = new Set([...Object.keys(b), ...Object.keys(a)])
  const lines: string[] = []
  for (const k of keys) {
    const bv = b[k]
    const av = a[k]
    if (JSON.stringify(bv) !== JSON.stringify(av)) {
      lines.push(`${k}:\n  antes: ${JSON.stringify(bv)}\n  depois: ${JSON.stringify(av)}`)
    }
  }
  return lines.length ? lines.join("\n\n") : "(sem diff de chaves — objetos iguais ou vazios)"
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionPreset, setActionPreset] = useState("__any__")
  const [actionFilter, setActionFilter] = useState("")
  const [entityTypeFilter, setEntityTypeFilter] = useState("")
  const [resultPreset, setResultPreset] = useState("__any__")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState<AdminLogItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const effectiveAction = actionPreset !== "__any__" ? actionPreset : actionFilter.trim()

  const effectiveResult = resultPreset !== "__any__" ? resultPreset : ""

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set("take", "50")
    if (effectiveAction) params.set("action", effectiveAction)
    if (entityTypeFilter.trim()) params.set("entityType", entityTypeFilter.trim())
    if (effectiveResult) params.set("result", effectiveResult)
    if (dateFrom) {
      const d = new Date(`${dateFrom}T00:00:00`)
      if (!Number.isNaN(d.getTime())) params.set("from", d.toISOString())
    }
    if (dateTo) {
      const d = new Date(`${dateTo}T23:59:59.999`)
      if (!Number.isNaN(d.getTime())) params.set("to", d.toISOString())
    }
    return params
  }, [effectiveAction, entityTypeFilter, effectiveResult, dateFrom, dateTo])

  async function load(reset = false) {
    setLoading(true)
    try {
      const params = new URLSearchParams(queryParams)
      if (!reset && cursor) params.set("cursor", cursor)
      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao buscar logs")

      const nextItems = data.items ?? []
      setLogs((prev) => (reset ? nextItems : [...prev, ...nextItems]))
      setCursor(data.nextCursor)
      setHasMore(Boolean(data.nextCursor))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCursor(null)
    setLogs([])
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleApplyFilter(e: React.FormEvent) {
    e.preventDefault()
    setCursor(null)
    setLogs([])
    load(true)
  }

  function openDetail(log: AdminLogItem) {
    setSelected(log)
    setSheetOpen(true)
  }

  const sheetBefore = selected ? tryParseJson(selected.beforeData) : null
  const sheetAfter = selected ? tryParseJson(selected.afterData) : null
  const sheetDetails = selected ? tryParseJson(selected.details) : null
  const diffText =
    selected && sheetBefore && sheetAfter ? simpleKeyDiff(sheetBefore, sheetAfter) : ""

  function exportCsvUrl() {
    const p = new URLSearchParams(queryParams)
    p.set("format", "csv")
    return `/api/admin/logs?${p.toString()}`
  }

  function previewDetails(log: AdminLogItem): string {
    if (!log.details) return "—"
    const p = tryParseJson(log.details)
    if (p != null) {
      const s = JSON.stringify(p)
      return s.length > 120 ? s.slice(0, 120) + "…" : s
    }
    return log.details.length > 120 ? log.details.slice(0, 120) + "…" : log.details
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Logs de atividades
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Histórico do painel</CardTitle>
          <CardDescription>
            Filtre por período, resultado e ação. Toque num evento (mobile) ou abra o detalhe para ver
            antes/depois e diff.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleApplyFilter}
            className="flex flex-col gap-4 md:gap-3"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label>De (data)</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Até (data)</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Resultado</Label>
                <Select value={resultPreset} onValueChange={setResultPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Todos</SelectItem>
                    <SelectItem value="success">success</SelectItem>
                    <SelectItem value="failed">failed</SelectItem>
                    <SelectItem value="warning">warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tipo de ação</Label>
                <Select value={actionPreset} onValueChange={setActionPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_HINTS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="actionFree">Ação (texto livre)</Label>
                <Input
                  id="actionFree"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  placeholder="Só usado se “Qualquer ação” estiver selecionado"
                  disabled={actionPreset !== "__any__"}
                />
              </div>
              <div className="space-y-1">
                <Label>Entidade</Label>
                <Input
                  value={entityTypeFilter}
                  onChange={(e) => setEntityTypeFilter(e.target.value)}
                  placeholder="Ex.: product, siteSettings, media…"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button type="submit" disabled={loading} className="sm:w-40">
                Aplicar filtro
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={exportCsvUrl()} target="_blank" rel="noreferrer">
                  Exportar CSV
                </a>
              </Button>
            </div>
          </form>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {logs.map((log) => {
              const date = new Date(log.createdAt)
              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => openDetail(log)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:bg-muted/40"
                >
                  <p className="text-xs text-muted-foreground">
                    {date.toLocaleString("pt-BR")}
                  </p>
                  <p className="font-mono text-sm font-medium text-foreground mt-1">{log.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(log.entityType ?? "—") + (log.entityId ? ` · ${log.entityId}` : "")}
                  </p>
                  <p className="text-xs mt-2 line-clamp-2 font-mono text-muted-foreground">
                    {previewDetails(log)}
                  </p>
                  <p className="text-[11px] text-primary mt-2">Toque para detalhes</p>
                </button>
              )
            })}
            {!loading && logs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum log encontrado.</p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="max-h-[520px] overflow-auto text-xs">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                    <th className="px-3 py-2 text-left font-medium">Ação</th>
                    <th className="px-3 py-2 text-left font-medium">Entidade</th>
                    <th className="px-3 py-2 text-left font-medium">Admin</th>
                    <th className="px-3 py-2 text-left font-medium">Detalhes</th>
                    <th className="px-3 py-2 text-left font-medium w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const date = new Date(log.createdAt)
                    const dateStr = date.toLocaleString("pt-BR")
                    return (
                      <tr
                        key={log.id}
                        className="border-t border-slate-100 dark:border-slate-800 align-top"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">{dateStr}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">
                          {log.action}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px]">
                          {(log.entityType ?? "—") + (log.entityId ? `/${log.entityId}` : "")}
                          <span className="block text-[10px] text-slate-500">
                            {log.result ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{log.adminEmail ?? "—"}</td>
                        <td className="px-3 py-2">
                          <pre className="max-h-20 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]">
                            {previewDetails(log)}
                          </pre>
                        </td>
                        <td className="px-3 py-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openDetail(log)}>
                            Ver
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && logs.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-slate-500 dark:text-slate-400"
                      >
                        Nenhum log encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {hasMore && (
            <Button onClick={() => load(false)} disabled={loading} variant="outline">
              {loading ? "Carregando..." : "Carregar mais"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm pr-8">{selected?.action ?? "—"}</SheetTitle>
            <SheetDescription className="text-left space-y-1">
              {selected && (
                <>
                  <span className="block">
                    {new Date(selected.createdAt).toLocaleString("pt-BR")}
                  </span>
                  <span className="block text-xs">
                    {selected.entityType ?? "—"}
                    {selected.entityId ? ` · ${selected.entityId}` : ""}
                  </span>
                  <span className="block text-xs">Resultado: {selected.result ?? "—"}</span>
                  <span className="block text-xs">Admin: {selected.adminEmail ?? "—"}</span>
                  <span className="block text-xs">IP: {selected.ip ?? "—"}</span>
                  <span className="block text-xs">Rota: {selected.path ?? "—"}</span>
                  <span className="block text-xs">Método: {selected.method ?? "—"}</span>
                </>
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="font-medium text-foreground mb-1">Detalhes</p>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                {selected
                  ? formatJsonBlock(sheetDetails, selected.details)
                  : "—"}
              </pre>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Antes (beforeData)</p>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                {selected
                  ? formatJsonBlock(sheetBefore, selected.beforeData)
                  : "—"}
              </pre>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Depois (afterData)</p>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                {selected
                  ? formatJsonBlock(sheetAfter, selected.afterData)
                  : "—"}
              </pre>
            </div>
            {diffText ? (
              <div>
                <p className="font-medium text-foreground mb-1">Diff (objeto → objeto)</p>
                <pre className="rounded-md border border-border p-3 text-xs overflow-x-auto max-h-56 overflow-y-auto whitespace-pre-wrap break-words">
                  {diffText}
                </pre>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
