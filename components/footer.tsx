"use client"

import Image from "next/image"
import {
  Package,
  MapPin,
  Clock,
  Phone,
  Facebook,
  Instagram,
  Music2,
  Youtube,
  Linkedin,
  Twitter,
  Link2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useSettings } from "@/components/providers/settings-provider"

export function Footer() {
  const settings = useSettings()
  const {
    siteName,
    siteTagline,
    city,
    phoneDisplay,
    addressLine,
    hoursWeekdays,
    hoursSaturday,
    hoursSunday,
    facebookUrl,
    instagramUrl,
    tiktokUrl,
    youtubeUrl,
    linkedinUrl,
    xUrl,
    customSocials,
    logoUrl,
  } = settings

  const [footerMenu, setFooterMenu] = useState<Array<{ id: string; label: string; slugOrUrl: string }>>([])

  // Parsed custom socials
  const customSocialsList: Array<{ label: string; url: string }> = (() => {
    try {
      const parsed = JSON.parse(customSocials)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((i) => i && typeof i.url === "string")
          .map((i) => ({ label: String(i.label ?? "Link"), url: String(i.url) }))
      }
      return []
    } catch {
      return []
    }
  })()

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return
        setFooterMenu(
          data
            .filter((i: any) => i.visible && (i.position === "footer" || i.position === "both"))
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
            .map((i: any) => ({
              id: i.id,
              label: String(i.label ?? "Item"),
              slugOrUrl: String(i.slugOrUrl ?? "/"),
            }))
        )
      })
      .catch(() => {})
  }, [])

  return (
    <footer className="mt-12 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna 1: Logo + tagline + menu */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-lg object-cover border border-border"
                  unoptimized={logoUrl.startsWith("http")}
                />
              ) : (
                <div className="flex items-center justify-center rounded-lg bg-primary p-2">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <span className="text-lg font-bold text-foreground">
                {siteName}
              </span>
            </div>
            {/* Tagline dinâmica do banco (fix #12) */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {siteTagline}
            </p>
            {footerMenu.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1 text-sm">
                {footerMenu.map((item) => (
                  <a key={item.id} href={item.slugOrUrl} className="text-muted-foreground hover:text-primary">
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Coluna 2: Endereço */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Endereço
            </h3>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                {addressLine}
                <br />
                {city}
              </span>
            </div>
          </div>

          {/* Coluna 3: Horários + Telefone (fix #7) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Horário de Funcionamento
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>{hoursWeekdays}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>{hoursSaturday}</span>
              </div>
              {/* Fix #7: exibe domingo com ícone Clock (estava com Phone) */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>{hoursSunday}</span>
              </div>
              {/* Telefone separado e correto */}
              {phoneDisplay && (
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <span>{phoneDisplay}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé inferior: copyright + redes sociais */}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4 text-xs text-muted-foreground flex-col md:flex-row">
          <span>© {new Date().getFullYear()} {siteName}. Todos os direitos reservados.</span>
          <div className="flex items-center gap-3">
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {tiktokUrl && (
              <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-muted-foreground hover:text-primary transition-colors">
                <Music2 className="h-4 w-4" />
              </a>
            )}
            {youtubeUrl && (
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {xUrl && (
              <a href={xUrl} target="_blank" rel="noopener noreferrer" aria-label="X" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {customSocialsList.map((item) => (
              <a
                key={`${item.label}-${item.url}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                title={item.label}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Link2 className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
