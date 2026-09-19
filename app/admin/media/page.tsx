"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Trash2, Link2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface MediaItem {
  id: string
  url: string
  size: number
  mtime: string
}

function formatSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/media", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao listar")
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Erro",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  async function copyUrl(url: string) {
    const absolute =
      typeof window !== "undefined" ? `${window.location.origin}${url.split("?")[0]}` : url
    try {
      await navigator.clipboard.writeText(absolute)
      toast({ title: "URL copiada" })
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" })
    }
  }

  async function removeItem(id: string) {
    if (!confirm(`Excluir ${id}?`)) return
    try {
      const res = await fetch(`/api/upload/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao excluir")
      toast({ title: "Arquivo removido" })
      load()
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Erro",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Biblioteca de mídia</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Arquivos enviados para <code className="text-xs">/public/uploads</code>. Copie a URL para
            usar em produtos, banners ou configurações.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploads</CardTitle>
          <CardDescription>
            Miniaturas com ações. Em produção, considere backup do diretório de uploads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum arquivo ainda. Envie imagens em Produtos, Banners ou Configurações.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => {
                const src = item.url
                const isImg = /\.(jpe?g|png|gif|webp)$/i.test(item.id)
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-square bg-muted">
                      {isImg ? (
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 20vw"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-2 text-center break-all">
                          {item.id}
                        </div>
                      )}
                    </div>
                    <div className="p-2 space-y-1 flex-1 flex flex-col">
                      <p className="text-[10px] font-mono truncate" title={item.id}>
                        {item.id}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(item.size)}</p>
                      <div className="flex gap-1 mt-auto pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 flex-1 text-xs px-1"
                          onClick={() => copyUrl(item.url)}
                        >
                          <Link2 className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-7 flex-1 text-xs px-1"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
