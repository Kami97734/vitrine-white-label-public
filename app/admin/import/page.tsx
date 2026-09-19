"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp, Download, Store, ShoppingCart, Braces, ClipboardPaste, Trash2, Image as ImageIcon, FileJson } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

type ImportItem = {
  name: string
  description?: string
  code?: string | null
  category?: string
  price?: number | string | null
  image?: string | null
  unitQuantity?: number | string | null
  unitMeasure?: string | null
  costPrice?: number | string | null
  sku?: string | null
  barcode?: string | null
}

function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let current: string[] = []
  let inQuotes = false
  let field = ""
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') inQuotes = false
      else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === "," || c === ";") {
        current.push(field.trim())
        field = ""
      } else if (c === "\n" || c === "\r") {
        if (field || current.length) {
          current.push(field.trim())
          lines.push(current)
          current = []
          field = ""
        }
        if (c === "\r" && text[i + 1] === "\n") i++
      } else field += c
    }
  }
  if (field || current.length) {
    current.push(field.trim())
    lines.push(current)
  }
  return lines
}

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/\s/g, "").replace(/[()]/g, "")
}

function buildItemsFromGenericCSV(text: string): ImportItem[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  const header = rows[0].map((h) => normalizeHeader(h))
  const nameIdx = header.indexOf("nome") >= 0 ? header.indexOf("nome") : 0
  const descIdx = header.indexOf("descricao") >= 0 ? header.indexOf("descricao") : 1
  const codeIdx = header.indexOf("codigo") >= 0 ? header.indexOf("codigo") : -1
  const catIdx = header.indexOf("categoria") >= 0 ? header.indexOf("categoria") : 2
  const priceIdx = header.indexOf("preco") >= 0 ? header.indexOf("preco") : 3
  const qtyIdx = header.indexOf("quantidade") >= 0 ? header.indexOf("quantidade") : -1
  const measureIdx = header.indexOf("unidadedemedida") >= 0 ? header.indexOf("unidadedemedida") : header.indexOf("medida")
  const costIdx = header.indexOf("custo") >= 0 ? header.indexOf("custo") : -1
  const skuIdx = header.indexOf("sku") >= 0 ? header.indexOf("sku") : -1
  const barcodeIdx = header.indexOf("codigobarras") >= 0 ? header.indexOf("codigobarras") : -1

  const items: ImportItem[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[nameIdx]?.trim()
    if (!name) continue
    items.push({
      name,
      description: row[descIdx]?.trim() ?? "",
      code: codeIdx >= 0 ? row[codeIdx]?.trim() || null : null,
      category: row[catIdx]?.trim() ?? "",
      price: row[priceIdx] ?? null,
      unitQuantity: qtyIdx >= 0 ? row[qtyIdx] ?? null : null,
      unitMeasure: measureIdx >= 0 ? (row[measureIdx]?.trim() || "un") : "un",
      costPrice: costIdx >= 0 ? row[costIdx] ?? null : null,
      sku: skuIdx >= 0 ? row[skuIdx]?.trim() || null : null,
      barcode: barcodeIdx >= 0 ? row[barcodeIdx]?.trim() || null : null,
    })
  }
  return items
}

function buildItemsFromShopifyCSV(text: string): ImportItem[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  const headerRaw = rows[0]
  const header = headerRaw.map((h) => normalizeHeader(h))
  const idx = (key: string) => header.indexOf(normalizeHeader(key))

  const titleIdx = idx("Title")
  const bodyIdx = idx("Body (HTML)")
  const skuIdx = idx("Variant SKU")
  const handleIdx = idx("Handle")
  const typeIdx = idx("Type")
  const priceIdx = idx("Variant Price")
  const imgIdx = idx("Image Src")

  const items: ImportItem[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[titleIdx]?.trim()
    if (!name) continue
    const sku = skuIdx >= 0 ? row[skuIdx]?.trim() : ""
    const handle = handleIdx >= 0 ? row[handleIdx]?.trim() : ""
    items.push({
      name,
      description: (bodyIdx >= 0 ? row[bodyIdx] : "")?.trim() ?? "",
      code: (sku || handle) ? (sku || handle) : null,
      category: (typeIdx >= 0 ? row[typeIdx] : "")?.trim() ?? "",
      price: priceIdx >= 0 ? row[priceIdx] : null,
      image: imgIdx >= 0 ? row[imgIdx]?.trim() || null : null,
      sku: sku?.trim() || null,
      unitMeasure: "un",
    })
  }
  return items
}

function buildItemsFromWooCSV(text: string): ImportItem[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  const headerRaw = rows[0]
  const header = headerRaw.map((h) => normalizeHeader(h))
  const idx = (key: string) => header.indexOf(normalizeHeader(key))

  const nameIdx = idx("Name")
  const descIdx = idx("Description")
  const skuIdx = idx("SKU")
  const catIdx = idx("Categories")
  const priceIdx = idx("Regular price") >= 0 ? idx("Regular price") : idx("Sale price")
  const imagesIdx = idx("Images")

  const items: ImportItem[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[nameIdx]?.trim()
    if (!name) continue
    const categories = (catIdx >= 0 ? row[catIdx] : "") ?? ""
    const firstCategory = String(categories).split(",")[0]?.trim() ?? ""
    const images = imagesIdx >= 0 ? String(row[imagesIdx] ?? "").split(",") : []
    items.push({
      name,
      description: (descIdx >= 0 ? row[descIdx] : "")?.trim() ?? "",
      code: skuIdx >= 0 ? row[skuIdx]?.trim() || null : null,
      category: firstCategory,
      price: priceIdx >= 0 ? row[priceIdx] : null,
      image: images[0]?.trim() || null,
      sku: skuIdx >= 0 ? row[skuIdx]?.trim() || null : null,
      unitMeasure: "un",
    })
  }
  return items
}

export default function AdminImportPage() {
  const [mode, setMode] = useState<"csv" | "shopify" | "woo" | "json" | "paste">("csv")
  const [file, setFile] = useState<File | null>(null)
  const [jsonText, setJsonText] = useState("")
  const [pasteText, setPasteText] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [configFile, setConfigFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    products?: { created: number; updated: number }
    categories?: { created: number }
    images?: { matched: number; uploaded: number }
    config?: { imported: boolean; banners?: number; home?: number; menu?: number; settings?: boolean }
  } | null>(null)
  const { toast } = useToast()

  function addImages(newFiles: File[]) {
    if (!newFiles.length) return
    const MAX = 60
    setImages((prev) => [...prev, ...newFiles].slice(0, MAX))
  }

  function handleImagesDropped(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith("image/"))
    addImages(files)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()

      if (mode === "csv") {
        if (!file) {
          toast({ title: "Selecione um arquivo CSV", variant: "destructive" })
          return
        }
        formData.append("file", file)
        formData.append("source", "csv")
      } else if (mode === "shopify" || mode === "woo") {
        if (!file) {
          toast({ title: "Selecione um arquivo CSV exportado da plataforma", variant: "destructive" })
          return
        }
        const text = await file.text()
        const items =
          mode === "shopify" ? buildItemsFromShopifyCSV(text) : buildItemsFromWooCSV(text)
        if (!items.length) {
          throw new Error("Não consegui ler os produtos desse arquivo. Verifique o CSV exportado.")
        }
        formData.append("items", JSON.stringify(items))
        formData.append("source", mode)
      } else if (mode === "json") {
        const parsed = JSON.parse(jsonText || "[]")
        const items: ImportItem[] = Array.isArray(parsed) ? parsed : parsed.items
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error("Cole um JSON (array) com ao menos 1 produto")
        }
        formData.append("items", JSON.stringify(items))
        formData.append("source", "json")
      } else {
        const items = buildItemsFromGenericCSV(pasteText)
        if (!items.length) {
          throw new Error("Cole os dados com cabeçalho (nome;descricao;codigo;categoria;preco)")
        }
        formData.append("items", JSON.stringify(items))
        formData.append("source", "paste")
      }

      // Imagens (opcional): backend usa o nome do arquivo -> código do produto.
      for (const img of images) {
        formData.append("images", img, img.name)
      }

      if (configFile) {
        formData.append("config", configFile, configFile.name)
      }

      const res = await fetch("/api/admin/catalog/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao importar")

      setResult(data)
      setFile(null)
      setJsonText("")
      setPasteText("")
      setConfigFile(null)
      setImages([])
      toast({ title: "Importação concluída" })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Erro ao importar catálogo",
        description: "Confira se o CSV tem as colunas corretas e se os nomes dos arquivos de imagem seguem o padrão `CODIGO.jpg`.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleDownloadTemplate() {
    window.open("/api/import", "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Importar produtos
        </h1>
        <p className="text-sm text-slate-500">
          Importe de diferentes plataformas (CSV/Shopify/WooCommerce/JSON/colar dados) usando o mesmo fluxo de cadastro.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Importar produtos</CardTitle>
          <CardDescription>
            Produtos existentes (por <strong>código</strong>) serão atualizados; novos serão criados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => { setMode(v as typeof mode); setResult(null); setFile(null) }} className="space-y-4">
            <TabsList className="w-full justify-start flex-wrap h-auto">
              <TabsTrigger value="csv" className="gap-2">
                <FileUp className="h-4 w-4" />
                CSV (modelo do painel)
              </TabsTrigger>
              <TabsTrigger value="shopify" className="gap-2">
                <Store className="h-4 w-4" />
                Shopify
              </TabsTrigger>
              <TabsTrigger value="woo" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                WooCommerce
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <Braces className="h-4 w-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-2">
                <ClipboardPaste className="h-4 w-4" />
                Colar dados
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="csv" className="space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-900/40">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Envie um CSV com colunas: <strong>nome</strong>, <strong>descricao</strong>,{" "}
                    <strong>codigo</strong>, <strong>categoria</strong>, <strong>preco</strong>.
                  </p>
                  <div className="mt-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".csv"
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Arquivo: {file.name}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shopify" className="space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-900/40">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Exporte produtos do Shopify e envie o CSV aqui. Mapeamento principal:{" "}
                    <strong>Title</strong>, <strong>Body (HTML)</strong>, <strong>Variant SKU</strong>,{" "}
                    <strong>Type</strong>, <strong>Variant Price</strong>, <strong>Image Src</strong>.
                  </p>
                  <div className="mt-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".csv"
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Arquivo: {file.name}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="woo" className="space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-900/40">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Exporte do WooCommerce e envie o CSV. Mapeamento principal:{" "}
                    <strong>Name</strong>, <strong>Description</strong>, <strong>SKU</strong>,{" "}
                    <strong>Categories</strong>, <strong>Regular price</strong>, <strong>Images</strong>.
                  </p>
                  <div className="mt-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".csv"
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Arquivo: {file.name}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="json" className="space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Cole um JSON (array) no formato:
                    <span className="font-mono text-xs ml-2">[{`{ name, description, code, category, price, image }`}]</span>
                  </p>
                  <Textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    rows={10}
                    placeholder='[{"name":"Produto A","description":"...","code":"SKU123","category":"Copos","price":9.9,"image":"https://..."}]'
                  />
                </div>
              </TabsContent>

              <TabsContent value="paste" className="space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Cole aqui como uma planilha (separado por <strong>;</strong> ou <strong>,</strong>) com cabeçalho:
                     <span className="font-mono text-xs ml-2">nome;descricao;codigo;categoria;preco;quantidade;unidade;custo;sku;codigobarras</span>
                   </p>
                   <Textarea
                     value={pasteText}
                     onChange={(e) => setPasteText(e.target.value)}
                     rows={10}
                     placeholder={"nome;descricao;codigo;categoria;preco;quantidade;unidade;custo;sku;codigobarras\nCopo 200ml;Copo descartável;SKU001;Copos;9,90;100;un;5,00;SKU001;7890000000000"}
                   />
                </div>
              </TabsContent>

              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-slate-500" />
                        Imagens (opcional)
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Faça upload das fotos com nome igual ao <strong>código</strong> do produto.
                        Ex.: <span className="font-mono text-xs">SKU001.jpg</span>. O sistema usa isso para
                        preencher `product.image` e `product.images`.
                      </p>
                    </div>
                    <div>
                      <input
                        id="import-images-input"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => addImages(Array.from(e.target.files ?? []))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("import-images-input")?.click()}
                      >
                        Escolher imagens
                      </Button>
                    </div>
                  </div>

                  <div
                    className="mt-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={handleImagesDropped}
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-300">Arraste as imagens aqui (drag&drop)</p>
                    {images.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">{images.length} selecionadas (máx. 60)</p>
                    )}
                  </div>

                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {images.slice(0, 25).map((img, idx) => (
                        <div
                          key={`${img.name}-${idx}`}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 p-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 break-all">
                              {img.name}
                            </p>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {images.length > 25 && (
                        <p className="col-span-full text-xs text-slate-500">
                          +{images.length - 25} imagens (listagem resumida)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-slate-500" />
                        config.json (opcional)
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Se enviado, o sistema sincroniza <strong>banners</strong>, <strong>home</strong>,{" "}
                        <strong>menu</strong> e <strong>settings</strong>.
                      </p>
                    </div>
                    <div className="w-full md:w-64">
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
                        onChange={(e) => setConfigFile(e.target.files?.[0] ?? null)}
                      />
                      {configFile && (
                        <p className="mt-2 text-xs text-slate-500">Arquivo: {configFile.name}</p>
                      )}
                      <div className="mt-3 flex gap-2 flex-col sm:flex-row">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open("/api/admin/catalog/template", "_blank")}
                        >
                          Baixar template
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open("/api/admin/catalog/export", "_blank")}
                        >
                          Exportar catálogo
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (mode === "csv" && !file) ||
                    ((mode === "shopify" || mode === "woo") && !file) ||
                    (mode === "json" && !jsonText.trim()) ||
                    (mode === "paste" && !pasteText.trim())
                  }
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  {loading ? "Importando..." : "Importar"}
                </Button>
                <Button type="button" variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar CSV atual
                </Button>
              </div>
            </form>
          </Tabs>
          {loading && (
            <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm space-y-2">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
          )}

          {!loading && result && (
            <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
              <p>
                Produtos criados: <strong>{result.products?.created ?? 0}</strong>
              </p>
              <p>
                Produtos atualizados: <strong>{result.products?.updated ?? 0}</strong>
              </p>
              {result.categories?.created != null && (
                <p>
                  Categorias criadas: <strong>{result.categories?.created}</strong>
                </p>
              )}
              {result.images && (
                <p>
                  Imagens aplicadas: <strong>{result.images.matched}</strong> (uploads:{" "}
                  <strong>{result.images.uploaded}</strong>)
                </p>
              )}

              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Button asChild variant="outline" className="justify-center">
                  <Link href="/admin/products">Ver produtos</Link>
                </Button>
                <Button asChild variant="outline" className="justify-center">
                  <Link href="/admin/logs">Ver logs</Link>
                </Button>
                <Button type="button" variant="outline" className="justify-center" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar template
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
