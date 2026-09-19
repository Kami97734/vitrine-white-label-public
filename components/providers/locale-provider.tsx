"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import ptBR from "@/lib/locales/pt-BR"
import type { LocaleKey } from "@/lib/locales/pt-BR"
import { useSettings } from "./settings-provider"

type LocaleMap = typeof ptBR

const LOCALE_MAP: Record<string, LocaleMap> = {
  "pt-BR": ptBR,
}

type LocaleContextType = {
  t: (key: LocaleKey, params?: Record<string, string | number>) => string
  locale: string
}

const LocaleContext = createContext<LocaleContextType>({
  t: (key) => ptBR[key] ?? key,
  locale: "pt-BR",
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const settings = useSettings()

  const value = useMemo(() => {
    const lang: string = (settings as any).language ?? "pt-BR"
    const dict = LOCALE_MAP[lang] ?? ptBR

    function t(key: LocaleKey, params?: Record<string, string | number>): string {
      let text = dict[key]
      if (!text) return key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v))
        }
      }
      return text
    }

    return { t, locale: lang }
  }, [settings])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextType {
  return useContext(LocaleContext)
}
