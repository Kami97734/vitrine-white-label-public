"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Check, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

interface Product {
  id: string
  name: string
  description: string
  image: string
  categoryId: string
  category?: { title: string }
  price: number
  oldPrice?: number
  unitQuantity?: number
  unitMeasure?: string
}

export default function AdminPromoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string[]>([])
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()
  const selectedIds = new Set(selectedOrder)

  async function loadProducts() {
    const res = await fetch("/api/products")
    const data = await res.json()
    if (res.ok) setProducts(Array.isArray(data.products) ? data.products : [])
  }

  async function loadPromoIds() {
    const res = await fetch("/api/admin/promo", { credentials: "include" })
    const data = await res.json()
    if (res.ok && Array.isArray(data)) {
      setSelectedOrder(data)
    } else if (res.ok && data.productIds) {
      setSelectedOrder(data.productIds)
      setAutoEnabled(Boolean(data.autoEnabled))
    }
  }

  useEffect(() => {
    Promise.all([loadProducts(), loadPromoIds()]).finally(() => setLoading(false))
  }, [])

  function toggle(id: string) {
    setSelectedOrder((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function moveUp(id: string) {
    const i = selectedOrder.indexOf(id)
    if (i <= 0) return
    const next = [...selectedOrder]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setSelectedOrder(next)
  }

  function moveDown(id: string) {
    const i = selectedOrder.indexOf(id)
    if (i < 0 || i >= selectedOrder.length - 1) return
    const next = [...selectedOrder]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setSelectedOrder(next)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedOrder, autoEnabled }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar")
      toast({ title: "Ofertas imperdíveis atualizadas" })
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateAuto() {
    setGenerating(true)
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar")
      await loadPromoIds()
      toast({ title: "Ofertas geradas automaticamente!" })
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro", variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Carregando...</p>
      </div>
    )
  }

  const selectedProducts = selectedOrder
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 p-2">
          <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ofertas imperdíveis</h1>
          <p className="text-sm text-slate-500">Escolha quais produtos aparecem na seção &quot;Ofertas imperdíveis&quot; da homepage. A ordem aqui é a ordem de exibição.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Produtos selecionados ({selectedIds.size})</CardTitle>
              <CardDescription>Clique em um produto na lista abaixo para adicionar ou remover. Use as setas para reordenar.</CardDescription>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Promoção automática</p>
                <p className="text-xs text-slate-500">Seleciona os melhores produtos sozinho</p>
              </div>
              <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateAuto}
                disabled={generating || !autoEnabled}
                className="gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Gerando..." : "Gerar"}
              </Button>
            </div>
          </div>
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedProducts.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 text-sm"
                >
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveUp(p.id)} disabled={i === 0}>
                    ↑
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveDown(p.id)} disabled={i === selectedProducts.length - 1}>
                    ↓
                  </Button>
                  <span className="max-w-[180px] truncate">{p.name}</span>
                  <button type="button" onClick={() => toggle(p.id)} className="text-destructive hover:underline ml-1">
                    remover
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Salvando..." : "Salvar ofertas"}
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os produtos</CardTitle>
          <CardDescription>Clique para marcar ou desmarcar. Produtos marcados entram na seção de ofertas na ordem em que aparecem acima.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const isSelected = selectedIds.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
                    {isSelected ? <Check className="h-5 w-5 text-primary" /> : <span className="text-xs text-slate-500">+</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">R$ {typeof p.price === "number" ? p.price.toFixed(2) : p.price}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {products.length === 0 && (
            <p className="py-8 text-center text-slate-500">Nenhum produto cadastrado. Cadastre em Produtos primeiro.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
