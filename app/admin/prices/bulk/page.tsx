"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, Upload, Package } from "lucide-react"

export default function BulkPriceUpdatePage() {
  const [mode, setMode] = useState<"percentage" | "fixed">("percentage")
  const [filterCategory] = useState("")
  const [filterSearch, setFilterSearch] = useState("")
  const [adjustment, setAdjustment] = useState("")
  const [results, setResults] = useState<{ code: string; name: string; oldPrice: number; newPrice: number }[]>([])
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handlePreview() {
    if (!adjustment) {
      toast({ title: "Informe o valor do ajuste", variant: "destructive" })
      return
    }
    setLoading(true)
    setApplied(false)
    try {
      const params = new URLSearchParams({ limit: "500" })
      if (filterCategory) params.set("categoryId", filterCategory)
      if (filterSearch) params.set("search", filterSearch)

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro")

      const products = data.products ?? []
      const adjustmentValue = parseFloat(adjustment)

      const updated = products.map((p: { code: string; name: string; price: number }) => {
        let newPrice: number
        if (mode === "percentage") {
          newPrice = p.price * (1 + adjustmentValue / 100)
        } else {
          newPrice = p.price + adjustmentValue
        }
        newPrice = Math.round(Math.max(0, newPrice) * 100) / 100
        return {
          code: p.code ?? "-",
          name: p.name,
          oldPrice: p.price,
          newPrice,
        }
      })

      setResults(updated)
      toast({ title: `${updated.length} produtos calculados` })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    setLoading(true)
    let success = 0
    let fail = 0

    for (const r of results) {
      if (r.code === "-") { fail++; continue }
      try {
        const res = await fetch(`/api/products/code/${r.code}/price`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: r.newPrice }),
          credentials: "include",
        })
        if (res.ok) success++
        else fail++
      } catch {
        fail++
      }
    }

    setApplied(true)
    setLoading(false)
    toast({ title: `Concluído! ${success} atualizados, ${fail} falhas.` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Atualizar Preços em Lote</h1>
        <p className="text-sm text-slate-500">
          Aplique ajustes percentuais ou fixos em vários produtos de uma vez.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Filtros e ajuste
          </CardTitle>
          <CardDescription>
            Selecione os produtos e defina o ajuste
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterSearch">Buscar produtos</Label>
              <Input
                id="filterSearch"
                placeholder="Nome ou código..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Tipo de ajuste</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("percentage")}
                >
                  Percentual (%)
                </Button>
                <Button
                  type="button"
                  variant={mode === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("fixed")}
                >
                  Fixo (R$)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment">
                {mode === "percentage" ? "Percentual (ex: 10 para +10%, -5 para -5%)" : "Valor fixo (ex: 5 para +R$5, -3 para -R$3)"}
              </Label>
              <Input
                id="adjustment"
                type="number"
                step="any"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                className="w-40"
                placeholder={mode === "percentage" ? "Ex: 10" : "Ex: 5"}
              />
            </div>
            <Button onClick={handlePreview} disabled={loading}>
              <Package className="h-4 w-4 mr-2" />
              {loading ? "Calculando..." : "Calcular"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pré-visualização ({results.length} produtos)</CardTitle>
            <CardDescription>
              {applied ? "Preços já foram atualizados." : "Revise os novos preços antes de aplicar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Código</th>
                    <th className="text-left p-2 font-medium">Nome</th>
                    <th className="text-right p-2 font-medium">Preço atual</th>
                    <th className="text-right p-2 font-medium">Novo preço</th>
                    <th className="text-right p-2 font-medium">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const diff = r.newPrice - r.oldPrice
                    return (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="p-2">{r.code}</td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2 text-right">R$ {r.oldPrice.toFixed(2)}</td>
                        <td className="p-2 text-right font-medium">R$ {r.newPrice.toFixed(2)}</td>
                        <td className={`p-2 text-right ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>
                          {diff > 0 ? "+" : ""}R$ {diff.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!applied && (
              <Button onClick={handleApply} disabled={loading} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Aplicando..." : `Aplicar preços (${results.length} produtos)`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
