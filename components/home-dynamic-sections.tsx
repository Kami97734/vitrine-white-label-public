"use client"

import { useEffect, useState } from "react"

type Section = {
  id: string
  key: string
  type: string
  value: string
  sortOrder: number
}

/** fix #13: Converte chaves internas (snake_case) em títulos legíveis ao usuário */
function formatSectionKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function HomeDynamicSections() {
  const [sections, setSections] = useState<Section[]>([])

  useEffect(() => {
    fetch("/api/home/sections")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSections(
            data
              .map((s) => ({
                id: String(s.id ?? s.key),
                key: String(s.key ?? ""),
                type: String(s.type ?? "text"),
                value: String(s.value ?? ""),
                sortOrder: Number(s.sortOrder ?? 0),
              }))
              .sort((a, b) => a.sortOrder - b.sortOrder)
          )
        }
      })
      .catch(() => {})
  }, [])

  if (!sections.length) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:px-8 sm:px-6">
      {sections.map((section) => (
        <article key={section.id} className="rounded-xl border border-border bg-card p-5">
          {/* fix #13: exibe título legível em vez da chave interna do banco */}
          <h3 className="text-base font-semibold text-foreground">{formatSectionKey(section.key)}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{section.value}</p>
        </article>
      ))}
    </section>
  )
}
