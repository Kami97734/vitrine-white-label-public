"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function AdminPricesPage() {
  const [code, setCode] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) {
      toast({ title: "Informe o código do produto", variant: "destructive" })
      return
    }
    const num = parseFloat(price.replace(",", "."))
    if (Number.isNaN(num) || num < 0) {
      toast({ title: "Preço inválido", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/products/price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), price: num }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar")
      toast({ title: "Preço atualizado" })
      setCode("")
      setPrice("")
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Preços rápidos por código
      </h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Atualizar preço por código</CardTitle>
          <CardDescription>
            Informe o código do produto e o novo preço. Ideal para atualizar valores direto do
            balcão ou do financeiro, sem abrir o cadastro completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do produto</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: PROD-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Novo preço (R$)</Label>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 19,90"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar preço"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
