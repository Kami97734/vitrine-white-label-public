"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUploader, type ImageItem } from "@/components/admin/image-uploader"
import { TEMPLATES } from "@/lib/templates"
import { useToast } from "@/hooks/use-toast"

function uploadsToItems(url: string): ImageItem[] {
  const u = url.trim()
  if (!u) return []

  if (u.includes("/uploads/")) {
    const raw = u.split("/uploads/")[1]?.split("?")[0]
    if (!raw) return []
    const id = decodeURIComponent(raw)
    const pathUrl = u.startsWith("http") ? u : u.startsWith("/") ? u : `/uploads/${id}`
    return [{ id, url: pathUrl }]
  }

  const pathUrl = u.startsWith("http") ? u : u.startsWith("/") ? u : `/${u}`
  return [{ id: encodeURIComponent(u), url: pathUrl }]
}

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("")
  const [siteTagline, setSiteTagline] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#0c87b8")
  const [secondaryColor, setSecondaryColor] = useState("#0f172a")
  const [accentColor, setAccentColor] = useState("#f97316")
  const [whatsappColor, setWhatsappColor] = useState("#22c55e")
  const [saleColor, setSaleColor] = useState("#f97316")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [phoneDisplay, setPhoneDisplay] = useState("")
  const [city, setCity] = useState("")
  const [addressLine, setAddressLine] = useState("")
  const [hoursWeekdays, setHoursWeekdays] = useState("")
  const [hoursSaturday, setHoursSaturday] = useState("")
  const [hoursSunday, setHoursSunday] = useState("")
  const [facebookUrl, setFacebookUrl] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")
  const [tiktokUrl, setTiktokUrl] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [xUrl, setXUrl] = useState("")
  const [customSocials, setCustomSocials] = useState("[]")
  const [heroCarouselEnabled, setHeroCarouselEnabled] = useState(false)
  const [cartEnabled, setCartEnabled] = useState(true)
  const [language, setLanguage] = useState("pt-BR")
  const [logoUrl, setLogoUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")
  const [heroWhatsappText, setHeroWhatsappText] = useState("")
  const [fabWhatsappText, setFabWhatsappText] = useState("")
  const [ctaPrimaryText, setCtaPrimaryText] = useState("")
  const [ctaSecondaryText, setCtaSecondaryText] = useState("")
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState("")
  const [promoSectionTitle, setPromoSectionTitle] = useState("")
  const [promoSectionSubtitle, setPromoSectionSubtitle] = useState("")
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [seoOgImageUrl, setSeoOgImageUrl] = useState("")
  const [seoBaseUrl, setSeoBaseUrl] = useState("")
  const [adminPanelTitle, setAdminPanelTitle] = useState("")
  const [adminPanelSubtitle, setAdminPanelSubtitle] = useState("")
  const [adminLogoUrl, setAdminLogoUrl] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setSiteName(data.siteName ?? "Demo Store")
        setSiteTagline(data.siteTagline ?? "")
        setPrimaryColor(data.primaryColor ?? "#0c87b8")
        setSecondaryColor(data.secondaryColor ?? "#0f172a")
        setAccentColor(data.accentColor ?? "#f97316")
        setWhatsappColor(data.whatsappColor ?? "#22c55e")
        setSaleColor(data.saleColor ?? "#f97316")
        setWhatsappNumber(data.whatsappNumber ?? "")
        setPhoneDisplay(data.phoneDisplay ?? "")
        setCity(data.city ?? "")
        setAddressLine(data.addressLine ?? "")
        setHoursWeekdays(data.hoursWeekdays ?? "")
        setHoursSaturday(data.hoursSaturday ?? "")
        setHoursSunday(data.hoursSunday ?? "")
        setFacebookUrl(data.facebookUrl ?? "")
        setInstagramUrl(data.instagramUrl ?? "")
        setTiktokUrl(data.tiktokUrl ?? "")
        setYoutubeUrl(data.youtubeUrl ?? "")
        setLinkedinUrl(data.linkedinUrl ?? "")
        setXUrl(data.xUrl ?? "")
        setCustomSocials(data.customSocials ?? "[]")
        setHeroCarouselEnabled(Boolean(data.heroCarouselEnabled ?? false))
        setCartEnabled(Boolean(data.cartEnabled ?? true))
        setLanguage(data.language ?? "pt-BR")
        setLogoUrl(data.logoUrl ?? "")
        setFaviconUrl(data.faviconUrl ?? "")
        setHeroWhatsappText(data.heroWhatsappText ?? "")
        setFabWhatsappText(data.fabWhatsappText ?? "")
        setCtaPrimaryText(data.ctaPrimaryText ?? "")
        setCtaSecondaryText(data.ctaSecondaryText ?? "")
        setCtaSecondaryUrl(data.ctaSecondaryUrl ?? "")
        setPromoSectionTitle(data.promoSectionTitle ?? "")
        setPromoSectionSubtitle(data.promoSectionSubtitle ?? "")
        setSeoTitle(data.seoTitle ?? "")
        setSeoDescription(data.seoDescription ?? "")
        setSeoOgImageUrl(data.seoOgImageUrl ?? "")
        setSeoBaseUrl(data.seoBaseUrl ?? "")
        setAdminPanelTitle(data.adminPanelTitle ?? "")
        setAdminPanelSubtitle(data.adminPanelSubtitle ?? "")
        setAdminLogoUrl(data.adminLogoUrl ?? "")
        setAdminEmail(data.adminEmail ?? "")
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, string | boolean> = {
        siteName: siteName.trim(),
        siteTagline: siteTagline.trim(),
        primaryColor: primaryColor.trim(),
        secondaryColor: secondaryColor.trim(),
        accentColor: accentColor.trim(),
        whatsappColor: whatsappColor.trim(),
        saleColor: saleColor.trim(),
        whatsappNumber: whatsappNumber.trim(),
        phoneDisplay: phoneDisplay.trim(),
        city: city.trim(),
        addressLine: addressLine.trim(),
        hoursWeekdays: hoursWeekdays.trim(),
        hoursSaturday: hoursSaturday.trim(),
        hoursSunday: hoursSunday.trim(),
        facebookUrl: facebookUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        tiktokUrl: tiktokUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        xUrl: xUrl.trim(),
        customSocials: customSocials.trim(),
        logoUrl: logoUrl.trim(),
        faviconUrl: faviconUrl.trim(),
        heroWhatsappText: heroWhatsappText.trim(),
        fabWhatsappText: fabWhatsappText.trim(),
        ctaPrimaryText: ctaPrimaryText.trim(),
        ctaSecondaryText: ctaSecondaryText.trim(),
        ctaSecondaryUrl: ctaSecondaryUrl.trim(),
        promoSectionTitle: promoSectionTitle.trim(),
        promoSectionSubtitle: promoSectionSubtitle.trim(),
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        seoOgImageUrl: seoOgImageUrl.trim(),
        seoBaseUrl: seoBaseUrl.trim(),
        heroCarouselEnabled,
        cartEnabled,
        language: language.trim(),
        adminPanelTitle: adminPanelTitle.trim(),
        adminPanelSubtitle: adminPanelSubtitle.trim(),
        adminLogoUrl: adminLogoUrl.trim(),
        adminEmail: adminEmail.trim(),
      }
      if (newPassword.trim()) body.newPassword = newPassword.trim()
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar")
      setSiteName(data.siteName ?? siteName)
      setSiteTagline(data.siteTagline ?? siteTagline)
      setPrimaryColor(data.primaryColor ?? primaryColor)
      setSecondaryColor(data.secondaryColor ?? secondaryColor)
      setAccentColor(data.accentColor ?? accentColor)
      setWhatsappColor(data.whatsappColor ?? whatsappColor)
      setSaleColor(data.saleColor ?? saleColor)
      setWhatsappNumber(data.whatsappNumber ?? whatsappNumber)
      setPhoneDisplay(data.phoneDisplay ?? phoneDisplay)
      setCity(data.city ?? city)
      setAddressLine(data.addressLine ?? addressLine)
      setHoursWeekdays(data.hoursWeekdays ?? hoursWeekdays)
      setHoursSaturday(data.hoursSaturday ?? hoursSaturday)
      setHoursSunday(data.hoursSunday ?? hoursSunday)
      setFacebookUrl(data.facebookUrl ?? facebookUrl)
      setInstagramUrl(data.instagramUrl ?? instagramUrl)
      setTiktokUrl(data.tiktokUrl ?? tiktokUrl)
      setYoutubeUrl(data.youtubeUrl ?? youtubeUrl)
      setLinkedinUrl(data.linkedinUrl ?? linkedinUrl)
      setXUrl(data.xUrl ?? xUrl)
      setCustomSocials(data.customSocials ?? customSocials)
      setLogoUrl(data.logoUrl ?? logoUrl)
      setFaviconUrl(data.faviconUrl ?? faviconUrl)
      setHeroWhatsappText(data.heroWhatsappText ?? heroWhatsappText)
      setFabWhatsappText(data.fabWhatsappText ?? fabWhatsappText)
      setCtaPrimaryText(data.ctaPrimaryText ?? ctaPrimaryText)
      setCtaSecondaryText(data.ctaSecondaryText ?? ctaSecondaryText)
      setCtaSecondaryUrl(data.ctaSecondaryUrl ?? ctaSecondaryUrl)
      setPromoSectionTitle(data.promoSectionTitle ?? promoSectionTitle)
      setPromoSectionSubtitle(data.promoSectionSubtitle ?? promoSectionSubtitle)
      setSeoTitle(data.seoTitle ?? seoTitle)
      setSeoDescription(data.seoDescription ?? seoDescription)
      setSeoOgImageUrl(data.seoOgImageUrl ?? seoOgImageUrl)
      setSeoBaseUrl(data.seoBaseUrl ?? seoBaseUrl)
      setHeroCarouselEnabled(Boolean(data.heroCarouselEnabled ?? heroCarouselEnabled))
      setCartEnabled(Boolean(data.cartEnabled ?? cartEnabled))
      setLanguage(data.language ?? language)
      setAdminPanelTitle(data.adminPanelTitle ?? adminPanelTitle)
      setAdminPanelSubtitle(data.adminPanelSubtitle ?? adminPanelSubtitle)
      setAdminLogoUrl(data.adminLogoUrl ?? adminLogoUrl)
      setAdminEmail(data.adminEmail ?? adminEmail)
      setNewPassword("")
      toast({ title: "Configurações salvas" })
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const logoItems = useMemo(() => uploadsToItems(logoUrl), [logoUrl])
  const faviconItems = useMemo(() => uploadsToItems(faviconUrl), [faviconUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Configurações do site
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Dados da loja, contato, redes sociais e acesso ao painel. Um único botão salva tudo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="identity" className="w-full">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1">
            <TabsTrigger value="identity" className="text-xs sm:text-sm">
              Identidade
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm">
              Contato
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs sm:text-sm">
              Redes
            </TabsTrigger>
            <TabsTrigger value="brand" className="text-xs sm:text-sm">
              Logo / favicon
            </TabsTrigger>
            <TabsTrigger value="vitrine" className="text-xs sm:text-sm">
              Vitrine / CTA
            </TabsTrigger>
            <TabsTrigger value="seo" className="text-xs sm:text-sm">
              SEO
            </TabsTrigger>
            <TabsTrigger value="painel" className="text-xs sm:text-sm">
              Painel Admin
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">
              Templates
            </TabsTrigger>
            <TabsTrigger value="admin" className="text-xs sm:text-sm">
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Identidade e cores</CardTitle>
            <CardDescription>
              Nome e cores usados no site e nos botões de pedido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nome do site</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Nome da sua loja / empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTagline">Slogan/descrição curta</Label>
              <Input
                id="siteTagline"
                value={siteTagline}
                onChange={(e) => setSiteTagline(e.target.value)}
                placeholder="Ex.: Embalagens para todo tipo de negócio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor base (hex)</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                />
                <Input
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#0c87b8"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Cor de fundo/cabeçalho</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-14 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                />
                <Input
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#0f172a"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Cor de destaque geral</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                />
                <Input
                  id="accentColor"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#f97316"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappColor">Cor dos botões de WhatsApp</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={whatsappColor}
                  onChange={(e) => setWhatsappColor(e.target.value)}
                  className="h-10 w-14 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                />
                <Input
                  id="whatsappColor"
                  value={whatsappColor}
                  onChange={(e) => setWhatsappColor(e.target.value)}
                  placeholder="#22c55e"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleColor">Cor de destaque / promoção</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={saleColor}
                  onChange={(e) => setSaleColor(e.target.value)}
                  className="h-10 w-14 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                />
                <Input
                  id="saleColor"
                  value={saleColor}
                  onChange={(e) => setSaleColor(e.target.value)}
                  placeholder="#f97316"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Contato e endereço</CardTitle>
            <CardDescription>
              WhatsApp, telefone, cidade, endereço e horários exibidos no rodapé.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">
                WhatsApp principal
                <span className="block text-xs text-slate-500">
                  Somente números, com DDI e DDD (ex.: 55 31 99999-9999 → 5531999999999)
                </span>
              </Label>
              <Input
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="5531999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneDisplay">Telefone exibido no rodapé</Label>
              <Input
                id="phoneDisplay"
                value={phoneDisplay}
                onChange={(e) => setPhoneDisplay(e.target.value)}
                placeholder="(31) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade / Localização</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex.: Sua cidade - UF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine">
                Endereço completo
                <span className="block text-xs text-slate-500">
                  Rua, número e bairro exibidos no rodapé.
                </span>
              </Label>
              <Input
                id="addressLine"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Ex.: Av. Exemplo, 123 - Centro"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="hoursWeekdays">Horário (segunda a sexta)</Label>
                <Input
                  id="hoursWeekdays"
                  value={hoursWeekdays}
                  onChange={(e) => setHoursWeekdays(e.target.value)}
                  placeholder="Ex.: Seg a Sex: 08:00 - 18:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoursSaturday">Horário (sábado)</Label>
                <Input
                  id="hoursSaturday"
                  value={hoursSaturday}
                  onChange={(e) => setHoursSaturday(e.target.value)}
                  placeholder="Ex.: Sáb: 08:00 - 12:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoursSunday">Horário (domingo)</Label>
                <Input
                  id="hoursSunday"
                  value={hoursSunday}
                  onChange={(e) => setHoursSunday(e.target.value)}
                  placeholder="Ex.: Dom: fechado"
                />
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Redes sociais</CardTitle>
            <CardDescription>
              Opcional. Links aparecem no rodapé com ícones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="URL do Facebook (opcional)"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
            />
            <Input
              placeholder="URL do Instagram (opcional)"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
            />
            <Input
              placeholder="URL do TikTok (opcional)"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
            />
            <Input
              placeholder="URL do YouTube (opcional)"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <Input
              placeholder="URL do LinkedIn (opcional)"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
            <Input
              placeholder="URL do X/Twitter (opcional)"
              value={xUrl}
              onChange={(e) => setXUrl(e.target.value)}
            />
            <div className="space-y-2">
              <Label htmlFor="customSocials">Redes customizadas (JSON)</Label>
              <Textarea
                id="customSocials"
                value={customSocials}
                onChange={(e) => setCustomSocials(e.target.value)}
                rows={3}
                placeholder='[{"label":"Pinterest","url":"https://...","icon":"link"}]'
              />
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="brand" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Logo, favicon e tema</CardTitle>
            <CardDescription>
              Envie imagens ou cole URL externa. Arquivos enviados ficam em Mídia no painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo — upload</Label>
              <ImageUploader
                inputId="settings-logo-upload"
                value={logoItems}
                onChange={(items) => setLogoUrl(items[0]?.url ?? "")}
                multiple={false}
                max={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">
                URL da logo (manual)
                <span className="block text-xs text-slate-500">
                  Sobrescreve ou complementa o upload (PNG, JPG, URL externa).
                </span>
              </Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://.../logo.png ou /uploads/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Favicon — upload</Label>
              <ImageUploader
                inputId="settings-favicon-upload"
                value={faviconItems}
                onChange={(items) => setFaviconUrl(items[0]?.url ?? "")}
                multiple={false}
                max={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">
                URL do favicon (manual)
                <span className="block text-xs text-slate-500">
                  ICO ou PNG pequeno; também aceita URL externa.
                </span>
              </Label>
              <Input
                id="faviconUrl"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://.../favicon.ico"
              />
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="vitrine" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Seção de ofertas (home)</CardTitle>
            <CardDescription>
              Título e subtítulo do bloco de produtos em promoção. Os produtos em si são definidos em
              Ofertas imperdíveis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promoSectionTitle">Título da seção</Label>
              <Input
                id="promoSectionTitle"
                value={promoSectionTitle}
                onChange={(e) => setPromoSectionTitle(e.target.value)}
                placeholder="Ofertas Imperdíveis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoSectionSubtitle">Subtítulo</Label>
              <Input
                id="promoSectionSubtitle"
                value={promoSectionSubtitle}
                onChange={(e) => setPromoSectionSubtitle(e.target.value)}
                placeholder="Aproveite nossos preços especiais"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>WhatsApp e botões (hero)</CardTitle>
            <CardDescription>
              Textos do banner principal. O título grande do hero continua em{" "}
              <span className="font-medium">Página inicial</span> no menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Texto do botão principal (hero)"
              value={ctaPrimaryText}
              onChange={(e) => setCtaPrimaryText(e.target.value)}
            />
            <Input
              placeholder="Texto do botão secundário (hero)"
              value={ctaSecondaryText}
              onChange={(e) => setCtaSecondaryText(e.target.value)}
            />
            <Input
              placeholder="URL do botão secundário (ex.: #ofertas)"
              value={ctaSecondaryUrl}
              onChange={(e) => setCtaSecondaryUrl(e.target.value)}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-3 dark:bg-slate-900">
                <Switch
                  id="heroCarouselEnabled"
                  checked={heroCarouselEnabled}
                  onCheckedChange={(checked) => setHeroCarouselEnabled(Boolean(checked))}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Banner hero em carrossel</p>
                  <p className="text-xs text-slate-500">Use seus banners para animar o bloco azul da home.</p>
                </div>
              </div>
              <Textarea
                rows={2}
                placeholder="Mensagem WhatsApp da hero (use {siteName})"
                value={heroWhatsappText}
                onChange={(e) => setHeroWhatsappText(e.target.value)}
              />
            </div>
            <Textarea
              rows={2}
              placeholder="Mensagem WhatsApp do botão flutuante (use {siteName})"
              value={fabWhatsappText}
              onChange={(e) => setFabWhatsappText(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Carrinho</CardTitle>
            <CardDescription>Habilita o sistema de carrinho de compras na vitrine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-3 dark:bg-slate-900">
              <Switch id="cartEnabled" checked={cartEnabled} onCheckedChange={setCartEnabled} />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Carrinho de compras</p>
                <p className="text-xs text-slate-500">Bot&atilde;o &ldquo;Adicionar&rdquo; nos produtos e drawer lateral</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Idioma</CardTitle>
            <CardDescription>Idioma padrão do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>SEO e compartilhamento</CardTitle>
            <CardDescription>Metadados para buscadores e redes sociais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="SEO título"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
            <Textarea
              rows={2}
              placeholder="SEO descrição"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
            <Input
              placeholder="URL base do site (https://...)"
              value={seoBaseUrl}
              onChange={(e) => setSeoBaseUrl(e.target.value)}
            />
            <Input
              placeholder="URL da imagem OG"
              value={seoOgImageUrl}
              onChange={(e) => setSeoOgImageUrl(e.target.value)}
            />
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="painel" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Marca do painel administrativo</CardTitle>
            <CardDescription>
              Título, subtítulo e logo exibidos no menu lateral e header do admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPanelTitle">Título do painel</Label>
              <Input
                id="adminPanelTitle"
                value={adminPanelTitle}
                onChange={(e) => setAdminPanelTitle(e.target.value)}
                placeholder="Painel Admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPanelSubtitle">Subtítulo do painel</Label>
              <Input
                id="adminPanelSubtitle"
                value={adminPanelSubtitle}
                onChange={(e) => setAdminPanelSubtitle(e.target.value)}
                placeholder="Gerencie catálogo, vitrine e configurações."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminLogoUrl">
                URL da logo do painel
                <span className="block text-xs text-slate-500">
                  Opcional. Se vazio, exibe o ícone padrão (escudo).
                </span>
              </Label>
              <Input
                id="adminLogoUrl"
                value={adminLogoUrl}
                onChange={(e) => setAdminLogoUrl(e.target.value)}
                placeholder="https://.../logo-admin.png ou /uploads/..."
              />
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Templates de Nicho</CardTitle>
            <CardDescription>
              Escolha um template pré-configurado para aplicar cores, textos e categorias padrão do nicho.
              As configurações atuais serão substituídas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group relative rounded-xl border border-border bg-card p-4 transition hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                      {tpl.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground">{tpl.description}</p>
                    </div>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1">
                    <span
                      className="h-5 w-5 rounded-full border"
                      style={{ backgroundColor: tpl.settings.primaryColor }}
                      title="Cor primária"
                    />
                    <span
                      className="h-5 w-5 rounded-full border"
                      style={{ backgroundColor: tpl.settings.secondaryColor }}
                      title="Cor secundária"
                    />
                    <span
                      className="h-5 w-5 rounded-full border"
                      style={{ backgroundColor: tpl.settings.accentColor }}
                      title="Cor de destaque"
                    />
                    <span
                      className="h-5 w-5 rounded-full border"
                      style={{ backgroundColor: tpl.settings.whatsappColor }}
                      title="Cor WhatsApp"
                    />
                  </div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{tpl.categories.length}</span> categorias
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={async () => {
                      if (!confirm(`Aplicar template "${tpl.name}"?\nIsso vai substituir as configurações atuais.`)) return
                      try {
                        const res = await fetch("/api/admin/catalog/template/apply", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ templateId: tpl.id }),
                          credentials: "include",
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || "Erro")
                        toast({ title: `Template "${tpl.name}" aplicado com sucesso!` })
                        window.location.reload()
                      } catch {
                        toast({ title: "Erro ao aplicar template", variant: "destructive" })
                      }
                    }}
                  >
                    Aplicar template
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

          </TabsContent>

          <TabsContent value="admin" className="space-y-4 mt-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Acesso ao painel</CardTitle>
            <CardDescription>
              Email e senha para entrar no admin. Não aparecem na vitrine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email do admin</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                Nova senha
                <span className="block text-xs text-slate-500">
                  Deixe em branco para manter a senha atual. Mínimo 8 caracteres.
                </span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </form>
    </div>
  )
}
