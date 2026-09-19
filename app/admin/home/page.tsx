"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

type HomeTextField = {
  key: string
  label: string
  placeholder: string
  textarea?: boolean
  helper?: string
}

const KEYS: HomeTextField[] = [
  {
    key: "heroTitle",
    label: "Título principal (hero)",
    placeholder: "Ex.: Tudo em embalagens e descartáveis",
    helper: "Texto grande do topo, a primeira frase que o cliente lê.",
  },
  {
    key: "heroSubtitle",
    label: "Subtítulo do topo",
    placeholder: "Ex.: Entrega rápida para sua cidade e região",
    helper: "Texto logo abaixo do título, explicando o que a loja oferece.",
  },
  {
    key: "highlightPhrase",
    label: "Frase de destaque",
    placeholder: "Ex.: Ofertas especiais toda semana",
    helper: "Pode ser usado em destaques, chamadas ou seções futuras.",
  },
  {
    key: "section1Title",
    label: "Título da seção 1",
    placeholder: "Ex.: Por que comprar com a gente",
  },
  {
    key: "section1Content",
    label: "Texto da seção 1",
    textarea: true,
    placeholder: "Ex.: Fale sobre diferenciais, atendimento, entrega, etc.",
  },
  {
    key: "section2Title",
    label: "Título da seção 2",
    placeholder: "Ex.: Nossos principais clientes",
  },
  {
    key: "section2Content",
    label: "Texto da seção 2",
    textarea: true,
    placeholder: "Ex.: Cite tipos de clientes ou nichos atendidos.",
  },
] as const

export default function AdminHomePage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [sections, setSections] = useState<
    Array<{ key: string; type: string; value: string; sortOrder: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetch("/api/home"), fetch("/api/home/sections")])
      .then(async ([homeRes, sectionsRes]) => {
        const data = await homeRes.json()
        const v: Record<string, string> = {}
        KEYS.forEach(({ key }) => {
          v[key] = data[key] ?? ""
        })
        setValues(v)

        const sectionData = await sectionsRes.json()
        if (Array.isArray(sectionData)) {
          setSections(
            sectionData.map((s, idx) => ({
              key: String(s.key ?? `section_${idx + 1}`),
              type: String(s.type ?? "text"),
              value: String(s.value ?? ""),
              sortOrder: Number(s.sortOrder ?? idx),
            }))
          )
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const [legacyRes, sectionsRes] = await Promise.all([
        fetch("/api/home", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
          credentials: "include",
        }),
        fetch("/api/home/sections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sections: sections.map((s, idx) => ({ ...s, sortOrder: idx })),
          }),
          credentials: "include",
        }),
      ])

      const legacyData = await legacyRes.json()
      const sectionsData = await sectionsRes.json()
      if (!legacyRes.ok) throw new Error(legacyData.error ?? "Erro ao salvar textos")
      if (!sectionsRes.ok) throw new Error(sectionsData.error ?? "Erro ao salvar seções")
      setValues((prev) => ({ ...prev, ...legacyData }))
      setSections(
        Array.isArray(sectionsData)
          ? sectionsData.map((s, idx) => ({
              key: String(s.key ?? `section_${idx + 1}`),
              type: String(s.type ?? "text"),
              value: String(s.value ?? ""),
              sortOrder: Number(s.sortOrder ?? idx),
            }))
          : sections
      )
      toast({ title: "Página inicial salva" })
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro", variant: "destructive" })
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Textos da página inicial
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Textos e seções da vitrine</CardTitle>
          <CardDescription>
            Ajuste os textos que aparecem na vitrine principal. Ideal para personalizar por nicho
            (embalagens, papelaria, autopeças, agro, etc).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {KEYS.map(({ key, label, placeholder, textarea, helper }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                {textarea ? (
                  <Textarea
                    id={key}
                    value={values[key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={key}
                    value={values[key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                )}
                {helper && (
                  <p className="text-xs text-slate-500">
                    {helper}
                  </p>
                )}
              </div>
            ))}
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seções dinâmicas</CardTitle>
          <CardDescription>
            Crie blocos extras para o site (texto, richtext, JSON). Estes blocos ficam no catálogo
            para renderização dinâmica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section, idx) => (
            <div key={`${section.key}-${idx}`} className="rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={section.key}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, key: e.target.value } : item))
                    )
                  }
                  placeholder="chave_da_secao"
                />
                <Input
                  value={section.type}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, type: e.target.value } : item))
                    )
                  }
                  placeholder="text | richtext | json"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setSections((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
              <Textarea
                rows={4}
                value={section.value}
                onChange={(e) =>
                  setSections((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item))
                  )
                }
                placeholder="Conteúdo da seção"
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setSections((prev) => [
                ...prev,
                {
                  key: `section_${prev.length + 1}`,
                  type: "text",
                  value: "",
                  sortOrder: prev.length,
                },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar seção
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
