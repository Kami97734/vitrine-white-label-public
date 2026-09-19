"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { GripVertical, PlusCircle, Trash2, ArrowDown, ArrowUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type MenuItemDto = {
  id: string
  label: string
  slugOrUrl: string
  position: string
  order: number
  visible: boolean
  targetType: string
  categoryId: string | null
}

type CategoryOption = { id: string; title: string }

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItemDto[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const [menuRes, catRes] = await Promise.all([
          fetch("/api/admin/menu", { credentials: "include" }),
          fetch("/api/admin/categories", { credentials: "include" }),
        ])
        if (!menuRes.ok) {
          console.warn("Erro ao carregar itens de menu", { status: menuRes.status })
          toast({
            title: "Não foi possível carregar os itens de menu.",
            variant: "destructive",
          })
          setItems([])
        } else {
          try {
            const raw = await menuRes.json()
            const menuData = Array.isArray(raw) ? (raw as MenuItemDto[]) : []
            setItems(menuData.sort((a, b) => a.order - b.order))
          } catch {
            console.warn("Resposta inválida em /api/admin/menu")
            toast({
              title: "Não foi possível interpretar os dados do menu.",
              variant: "destructive",
            })
            setItems([])
          }
        }

        if (catRes.ok) {
          try {
            const raw = await catRes.json()
            if (Array.isArray(raw)) {
              setCategories(raw as { id: string; title: string }[])
            } else {
              setCategories([])
            }
          } catch {
            console.warn("Resposta inválida em /api/admin/categories")
            setCategories([])
          }
        } else {
          // Falha em categorias não impede uso do menu;
          // só registra log e segue com lista vazia.
          console.warn("Erro ao carregar categorias para o menu", {
            status: catRes.status,
          })
          setCategories([])
        }
      } catch (e) {
        console.error(e)
        toast({ title: "Erro ao carregar menu", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  function handleChange(id: string, patch: Partial<MenuItemDto>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function handleAdd() {
    const tempId = `temp-${Date.now()}`
    const nextOrder = items.length ? Math.max(...items.map((i) => i.order)) + 1 : 0
    setItems((prev) => [
      ...prev,
      {
        id: tempId,
        label: "Novo item",
        slugOrUrl: "/",
        position: "header",
        order: nextOrder,
        visible: true,
        targetType: "url",
        categoryId: null,
      },
    ])
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function move(id: string, direction: "up" | "down") {
    setItems((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const index = sorted.findIndex((i) => i.id === id)
      if (index === -1) return prev
      const swapWith = direction === "up" ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= sorted.length) return prev
      const tmp = sorted[index].order
      sorted[index].order = sorted[swapWith].order
      sorted[swapWith].order = tmp
      return [...sorted]
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar menu")
      setItems(data.items)
      toast({ title: "Menu salvo com sucesso" })
    } catch (e) {
      console.error(e)
      toast({
        title: e instanceof Error ? e.message : "Erro ao salvar",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Menu do site</h1>
      <Card>
        <CardHeader>
          <CardTitle>Itens de navegação</CardTitle>
          <CardDescription>
            Controle os links que aparecem no cabeçalho e rodapé da vitrine. Ideal para adaptar
            por nicho (categorias, páginas institucionais, links externos).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Arrume rótulo, destino, posição e visibilidade. Use as setas para mudar a ordem.
            </p>
            <Button size="sm" onClick={handleAdd}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center"
              >
                <div className="flex items-center gap-2 md:w-8 md:flex-none text-slate-400">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 grid gap-2 md:grid-cols-5 md:items-center">
                  <div className="space-y-1">
                    <Label className="text-xs">Rótulo</Label>
                    <Input
                      value={item.label}
                      onChange={(e) => handleChange(item.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Destino</Label>
                    <Input
                      value={item.slugOrUrl}
                      onChange={(e) => handleChange(item.id, { slugOrUrl: e.target.value })}
                      placeholder="/minha-pagina ou https://..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={item.targetType}
                      onValueChange={(val) => handleChange(item.id, { targetType: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">URL / rota</SelectItem>
                        <SelectItem value="category">Categoria</SelectItem>
                        <SelectItem value="static_page">Página estática</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Posição</Label>
                    <Select
                      value={item.position}
                      onValueChange={(val) => handleChange(item.id, { position: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Posição" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">Cabeçalho</SelectItem>
                        <SelectItem value="footer">Rodapé</SelectItem>
                        <SelectItem value="both">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Visibilidade</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`visible-${item.id}`}
                        checked={item.visible}
                        onCheckedChange={(checked) => handleChange(item.id, { visible: checked })}
                      />
                      <Label htmlFor={`visible-${item.id}`} className="text-xs">
                        Visível
                      </Label>
                    </div>
                  </div>
                  {item.targetType === "category" && (
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Categoria vinculada</Label>
                      <Select
                        value={item.categoryId ?? ""}
                        onValueChange={(val) =>
                          handleChange(item.id, { categoryId: val || null })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 md:w-40 md:flex-none md:justify-end">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => move(item.id, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => move(item.id, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-slate-500">
                Nenhum item cadastrado ainda. Clique em &quot;Novo item&quot; para começar.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar menu"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

