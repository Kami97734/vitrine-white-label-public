"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  slug: string
  title: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function load() {
    const res = await fetch("/api/categories")
    const data = await res.json()
    if (res.ok) {
      const list = Array.isArray(data) ? data.map((c: { id: string; slug: string; title: string }) => ({ id: c.id, slug: c.slug, title: c.title })) : []
      setCategories(list)
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditingId(null)
    setSlug("")
    setTitle("")
    setModalOpen(true)
  }

  function openEdit(c: Category) {
    setEditingId(c.id)
    setSlug(c.slug)
    setTitle(c.title)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug.trim() || !title.trim()) {
      toast({ title: "Preencha slug e título", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/categories/${editingId}` : "/api/categories"
      const method = editingId ? "PUT" : "POST"
      const body = editingId ? { slug: slug.trim(), title: title.trim() } : { slug: slug.trim(), title: title.trim() }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar")
      toast({ title: editingId ? "Categoria atualizada" : "Categoria criada" })
      setModalOpen(false)
      load()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta categoria? Os produtos vinculados podem ser afetados.")) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE", credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao excluir")
      toast({ title: "Categoria excluída" })
      load()
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Carregando...</p>
      </div>
    )
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filteredCategories = categories.filter((c) => {
    if (!normalizedSearch) return true
    return (
      c.slug.toLowerCase().includes(normalizedSearch) ||
      c.title.toLowerCase().includes(normalizedSearch)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Categorias</h1>
          <p className="text-sm text-slate-500">
            Agrupe os produtos em seções (ex.: Embalagens, Papelaria, Agro, Autopeças). Essas
            categorias aparecem como blocos na vitrine.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova categoria
        </Button>
      </div>
      <div className="max-w-sm space-y-1">
        <Label htmlFor="categorySearch">Buscar</Label>
        <Input
          id="categorySearch"
          placeholder="Buscar por slug ou título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <th className="text-left p-3 font-medium">Slug</th>
                <th className="text-left p-3 font-medium">Título</th>
                <th className="text-right p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3">{c.slug}</td>
                  <td className="p-3 font-medium">{c.title}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {categories.length === 0 && (
          <div className="p-8 text-center text-slate-500">Nenhuma categoria.</div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>Slug é usado na URL. Título aparece no site.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/\s/g, "-").toLowerCase())}
                placeholder="ex: embalagens"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Embalagens"
                required
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
