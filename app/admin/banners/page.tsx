"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
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
import { ImageUploader, type ImageItem } from "@/components/admin/image-uploader"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl: string
  sortOrder: number
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [image, setImage] = useState<ImageItem[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function load() {
    const res = await fetch("/api/banners")
    const data = await res.json()
    if (res.ok) setBanners(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditingId(null)
    setTitle("")
    setLinkUrl("")
    setImage([])
    setModalOpen(true)
  }

  function openEdit(b: Banner) {
    setEditingId(b.id)
    setTitle(b.title)
    setLinkUrl(b.linkUrl)
    setImage([{ id: b.imageUrl.split("/").pop() ?? b.id, url: b.imageUrl }])
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const imageUrl = image[0]?.url ?? ""
    if (!title.trim() || !imageUrl || !linkUrl.trim()) {
      toast({ title: "Preencha título, imagem e link", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payload = { title: title.trim(), imageUrl, linkUrl: linkUrl.trim(), sortOrder: 0 }
      const url = editingId ? `/api/banners/${editingId}` : "/api/banners"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar")
      toast({ title: editingId ? "Banner atualizado" : "Banner criado" })
      setModalOpen(false)
      load()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este banner?")) return
    try {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast({ title: "Banner excluído" })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Banners</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo banner
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className="rounded-lg border border-border bg-card overflow-hidden"
          >
            <div className="aspect-video bg-muted dark:bg-muted relative">
              <Image
                src={b.imageUrl}
                alt={b.title}
                fill
                className="object-cover"
                sizes="100vw"
                unoptimized={b.imageUrl.startsWith("http")}
              />
            </div>
            <div className="p-3">
              <p className="font-medium truncate text-foreground">{b.title}</p>
              <p className="text-xs text-muted-foreground truncate">{b.linkUrl}</p>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {banners.length === 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
          Nenhum banner. Crie um para exibir na homepage.
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar banner" : "Novo banner"}</DialogTitle>
            <DialogDescription>Imagem e link exibidos na página inicial.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Promoção"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link (URL)</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <ImageUploader
                value={image}
                onChange={setImage}
                multiple={false}
                max={1}
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
