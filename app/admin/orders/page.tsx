"use client"

import { useCallback, useEffect, useState } from "react"
import { ShoppingBag, RefreshCw, Trash2, ChevronLeft, ChevronRight, Check, X, Clock, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product: { id: string; name: string; image: string }
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  channel: string
  status: string
  totalAmount: number
  notes: string | null
  createdAt: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  paid: "Pago",
}

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  paid: "outline",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  confirmed: <Check className="h-3 w-3" />,
  cancelled: <X className="h-3 w-3" />,
  paid: <CreditCard className="h-3 w-3" />,
}

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(s: string) {
  const d = new Date(s)
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toast } = useToast()
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/orders?${params}`, { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar")
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, toast])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro")
      toast({ title: "Status atualizado" })
      load()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro", variant: "destructive" })
    }
  }

  async function deleteOrder(id: string, name: string) {
    if (!confirm(`Excluir pedido de ${name}?`)) return
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro")
      toast({ title: "Pedido excluído" })
      load()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro", variant: "destructive" })
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ShoppingBag className="h-4 w-4" />
            <span>Painel Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-1">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos registrados via WhatsApp ou manualmente. Total: {total}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {statusFilter !== "all"
                ? `Nenhum pedido com status "${STATUS_LABELS[statusFilter] ?? statusFilter}".`
                : "Nenhum pedido ainda. Os pedidos chegam via WhatsApp."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{order.customerName}</CardTitle>
                      <Badge
                        variant={STATUS_VARIANTS[order.status] ?? "secondary"}
                        className="gap-1 text-xs"
                      >
                        {STATUS_ICONS[order.status]}
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customerPhone}
                      {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                      {" · "}
                      {formatDate(order.createdAt)}
                    </p>
                    {order.notes && (
                      <p className="text-xs text-muted-foreground italic">{order.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-lg font-bold text-foreground">{formatBRL(order.totalAmount)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    {expandedId === order.id ? "Ocultar itens" : `Ver ${order.items.length} item(s)`}
                  </Button>

                  <Select
                    value={order.status}
                    onValueChange={(v) => updateStatus(order.id, v)}
                  >
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => deleteOrder(order.id, order.customerName)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>

                {expandedId === order.id && (
                  <div className="mt-3 rounded-md border border-border divide-y divide-border">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}x · {formatBRL(item.unitPrice)} cada
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatBRL(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
