"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUploader, type ImageItem } from "@/components/admin/image-uploader"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, Sparkles, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  slug: string
  title: string
}

interface Product {
  id: string
  code: string | null
  name: string
  description: string
  image: string
  images?: string[]
  categoryId: string
  category: Category
  price: number
  oldPrice?: number
  unitQuantity?: number
  unitMeasure?: string
  costPrice?: number
  sku?: string
  barcode?: string | null
  stock?: number
}

function imagesToItems(urls: string[]): ImageItem[] {
  return urls.map((url, i) => ({ id: url.split("/").pop() ?? `img-${i}`, url }))
}

function itemsToUrls(items: ImageItem[]): string[] {
  return items.map((i) => i.url)
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    categoryId: "",
    image: "",
    images: [] as ImageItem[],
    price: "",
    oldPrice: "",
    unitQuantity: "1",
    unitMeasure: "un",
    costPrice: "",
    sku: "",
    barcode: "",
    stock: "-1",
  })
  const [saving, setSaving] = useState(false)
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const pageSize = 20
  const { toast } = useToast()

  async function loadProducts() {
    const res = await fetch("/api/products?limit=500")
    const data = await res.json()
    if (res.ok) setProducts(data.products ?? [])
  }

  async function loadCategories() {
    const res = await fetch("/api/admin/categories", { credentials: "include" })
    const data = await res.json()
    if (res.ok) setCategories(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    Promise.all([loadProducts(), loadCategories()]).finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({
      name: "",
      code: "",
      description: "",
      categoryId: categories[0]?.id ?? "",
      image: "",
      images: [],
      price: "",
      oldPrice: "",
      unitQuantity: "1",
      unitMeasure: "un",
      costPrice: "",
      sku: "",
      barcode: "",
      stock: "-1",
    })
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditingId(p.id)
    const allImages = p.image ? [p.image, ...(p.images ?? []).filter((u) => u !== p.image)] : p.images ?? []
    setForm({
      name: p.name,
      code: p.code ?? "",
      description: p.description,
      categoryId: p.categoryId,
      image: p.image,
      images: imagesToItems(allImages),
      price: String(p.price),
      oldPrice: p.oldPrice != null ? String(p.oldPrice) : "",
      unitQuantity: String(p.unitQuantity ?? 1),
      unitMeasure: p.unitMeasure ?? "un",
      costPrice: p.costPrice != null ? String(p.costPrice) : "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      stock: String(p.stock ?? -1),
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const description = form.description.trim()
      if (description.length < 50) {
        throw new Error("A descrição é obrigatória e deve ter ao menos 50 caracteres.")
      }
      const unitQuantity = parseInt(form.unitQuantity, 10)
      if (!Number.isFinite(unitQuantity) || unitQuantity <= 0) {
        throw new Error("A quantidade/unidade é obrigatória e deve ser maior que zero.")
      }
      if (!form.unitMeasure.trim()) {
        throw new Error("A unidade de medida é obrigatória (ex.: un, kg, g, L, m).")
      }
      const costPrice = parseFloat(form.costPrice || "0")
      if (!Number.isFinite(costPrice) || costPrice < 0) {
        throw new Error("O preço de custo é obrigatório e não pode ser negativo.")
      }
      if (!form.sku.trim()) {
        throw new Error("O SKU é obrigatório.")
      }

      const urls = itemsToUrls(form.images)
      const mainImage = (urls[0] ?? form.image) || "/images/placeholder.jpg"
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description,
        categoryId: form.categoryId,
        image: mainImage,
        images: urls,
        price: form.price ? parseFloat(form.price) : 0,
        oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : undefined,
        unitQuantity,
        unitMeasure: form.unitMeasure.trim(),
        costPrice,
        sku: form.sku.trim(),
        barcode: form.barcode.trim() || undefined,
        stock: parseInt(form.stock, 10) || -1,
      }
      const url = editingId ? `/api/products/${editingId}` : "/api/products"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar")
      toast({ title: editingId ? "Produto atualizado" : "Produto criado" })
      setModalOpen(false)
      loadProducts()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteTarget(null)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast({ title: "Produto excluído" })
      loadProducts()
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }

  function confirmDelete(p: Product) {
    setDeleteTarget(p)
  }

  async function handleDuplicate(p: Product) {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${p.name} (cópia)`,
        code: p.code ? `${p.code}-copy` : undefined,
        description: p.description,
        categoryId: p.categoryId,
        image: p.image,
        images: Array.isArray(p.images) ? p.images : [],
        price: p.price,
        oldPrice: p.oldPrice,
        unitQuantity: p.unitQuantity ?? 1,
        unitMeasure: p.unitMeasure ?? "un",
        costPrice: p.costPrice ?? 0,
        sku: p.sku ? `${p.sku}-copy` : undefined,
        barcode: p.barcode ?? undefined,
        stock: p.stock ?? -1,
      }),
      credentials: "include",
    })
    if (res.ok) {
      toast({ title: "Produto duplicado com sucesso" })
      loadProducts()
    } else {
      const data = await res.json()
      toast({ title: data.error ?? "Erro ao duplicar", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 bg-muted animate-pulse rounded" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="h-10 w-36 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter
    if (!matchesCategory) return false
    if (!normalizedSearch) return true
    const text =
      `${p.code ?? ""} ${p.name} ${p.category?.title ?? ""} ${p.description}`.toLowerCase()
    return text.includes(normalizedSearch)
  })
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Produtos</h1>
          <p className="text-sm text-slate-500">
            Cadastre e edite os itens do seu catálogo. Esses produtos aparecem na vitrine pública.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo produto
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1 space-y-1">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar por código, nome, descrição ou categoria..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="w-full md:w-60 space-y-1">
          <Label htmlFor="categoryFilter">Categoria</Label>
          <Select
            value={categoryFilter}
            onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}
          >
            <SelectTrigger id="categoryFilter">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <th className="text-left p-3 font-medium w-12"></th>
                  <th className="text-left p-3 font-medium">Código</th>
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">Categoria</th>
                  <th className="text-left p-3 font-medium">Un.</th>
                  <th className="text-left p-3 font-medium">Preço</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt=""
                        className="h-10 w-10 rounded object-cover border border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </td>
                  <td className="p-3">{p.code ?? "-"}</td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{p.category?.title ?? "-"}</td>
                  <td className="p-3">
                    {p.unitQuantity ?? 1} {p.unitMeasure ?? "un"}
                  </td>
                  <td className="p-3 font-mono text-sm">
                    {typeof p.price === "number"
                      ? p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : p.price}
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(p)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-8 text-center text-slate-500">Nenhum produto cadastrado.</div>
        )}
      </div>

      {filteredProducts.length > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {safePage} de {totalPages} ({filteredProducts.length} produtos)
          </span>
          <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget.id)}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>Preencha os campos e adicione fotos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="Ex: PROD-001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descrição</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-primary"
                  disabled={generatingDesc || !form.name.trim()}
                  onClick={async () => {
                    setGeneratingDesc(true)
                    try {
                      const res = await fetch("/api/ai/describe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          productName: form.name.trim(),
                          category: categories.find((c) => c.id === form.categoryId)?.title ?? "",
                        }),
                      })
                      const data = await res.json()
                      if (res.ok) {
                        setForm((f) => ({ ...f, description: data.description }))
                        toast({ title: "Descrição gerada com IA!" })
                      } else {
                        toast({ title: data.error ?? "Erro ao gerar descrição", variant: "destructive" })
                      }
                    } catch {
                      toast({ title: "Erro ao gerar descrição", variant: "destructive" })
                    } finally {
                      setGeneratingDesc(false)
                    }
                  }}
                >
                  <Sparkles className={`h-3 w-3 ${generatingDesc ? "animate-pulse" : ""}`} />
                  {generatingDesc ? "Gerando..." : "Gerar com IA"}
                </Button>
              </div>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oldPrice">Preço antigo (R$) - opcional</Label>
                <Input
                  id="oldPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.oldPrice}
                  onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="unitQuantity">Qtd. / Unidade *</Label>
                <Input
                  id="unitQuantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.unitQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, unitQuantity: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitMeasure">Medida *</Label>
                <Select
                  value={form.unitMeasure}
                  onValueChange={(v) => setForm((f) => ({ ...f, unitMeasure: v }))}
                >
                  <SelectTrigger id="unitMeasure">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {["un", "kg", "g", "L", "ml", "m", "cm", "cx", "pct", "par"].map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Custo (R$) *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="Ex: SKU-001"
                  required
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de barras (opcional)</Label>
              <Input
                id="barcode"
                value={form.barcode}
                onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                placeholder="Ex: 7890000000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">
                Estoque
                <span className="block text-xs text-muted-foreground">-1 = sem controle, 0 = fora de estoque</span>
              </Label>
              <Input
                id="stock"
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className="max-w-[120px]"
              />
            </div>
          </div>
            {form.price && form.oldPrice && (() => {
              const p = parseFloat(form.price)
              const o = parseFloat(form.oldPrice)
              if (Number.isNaN(p) || Number.isNaN(o) || o <= 0) return null
              if (p >= o) {
                return (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Preço atual maior ou igual ao antigo. O desconto não será exibido no site.
                  </p>
                )
              }
              const discountPct = Math.round(((o - p) / o) * 100)
              return (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Desconto calculado: <strong>{discountPct}%</strong> (de R$ {o.toFixed(2)} para R$ {p.toFixed(2)})
                </p>
              )
            })()}
            <div className="space-y-2">
              <Label>Fotos (primeira = principal)</Label>
              <ImageUploader
                value={form.images}
                onChange={(images) => setForm((f) => ({ ...f, images }))}
                multiple
                max={10}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
