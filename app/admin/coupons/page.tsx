"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Tag } from "lucide-react"
import { useLocale } from "@/components/providers/locale-provider"

type Coupon = {
  id: string
  code: string
  discount: number
  minValue: number
  maxUses: number
  usedCount: number
  expiresAt: string | null
  active: boolean
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState("")
  const [discount, setDiscount] = useState("")
  const [minValue, setMinValue] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const { toast } = useToast()
  const { t } = useLocale()

  async function load() {
    try {
      const res = await fetch("/api/admin/coupons", { credentials: "include" })
      setCoupons(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, discount, minValue, maxUses, expiresAt: expiresAt || null }),
        credentials: "include",
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Cupom criado" })
      setShowForm(false)
      setCode("")
      setDiscount("")
      setMinValue("")
      setMaxUses("")
      setExpiresAt("")
      load()
    } catch (err: any) {
      toast({ title: err.message || "Erro", variant: "destructive" })
    }
  }

  async function handleToggle(coupon: Coupon) {
    await fetch("/api/admin/coupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...coupon, active: !coupon.active }),
      credentials: "include",
    })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir cupom?")) return
    await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE", credentials: "include" })
    load()
  }

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
          <p className="text-sm text-muted-foreground">Gerencie códigos promocionais</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo cupom
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo cupom</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="PROMO10" required />
              </div>
              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="10" required />
              </div>
              <div className="space-y-2">
                <Label>Valor mínimo (R$)</Label>
                <Input type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Usos máximos (0 = ilimitado)</Label>
                <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Expira em (opcional)</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">Criar</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {coupons.length === 0 ? (
        <p className="text-muted-foreground">Nenhum cupom cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <Tag className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.discount}% de desconto
                  {c.minValue > 0 && ` | Mín: R$ ${c.minValue.toFixed(2)}`}
                  {c.maxUses > 0 && ` | Restam: ${c.maxUses - c.usedCount}`}
                  {c.expiresAt && ` | Expira: ${new Date(c.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <Switch checked={c.active} onCheckedChange={() => handleToggle(c)} />
              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
