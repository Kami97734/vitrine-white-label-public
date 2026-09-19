"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { TEMPLATES } from "@/lib/templates"
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Store } from "lucide-react"

const STEPS = ["Identidade", "Nichos", "Contato", "Finalizar"]

export default function AdminSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [siteName, setSiteName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [phoneDisplay, setPhoneDisplay] = useState("")

  async function handleFinish() {
    setLoading(true)
    try {
      if (selectedTemplate) {
        await fetch("/api/admin/catalog/template/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: selectedTemplate }),
          credentials: "include",
        })
      }

      const body: Record<string, string> = {}
      if (siteName.trim()) body.siteName = siteName.trim()
      if (logoUrl.trim()) body.logoUrl = logoUrl.trim()
      if (whatsappNumber.trim()) body.whatsappNumber = whatsappNumber.trim()
      if (phoneDisplay.trim()) body.phoneDisplay = phoneDisplay.trim()

      if (Object.keys(body).length > 0) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        })
      }

      await fetch("/api/admin/setup", { method: "POST", credentials: "include" })

      router.push("/admin")
      router.refresh()
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      i <= step
                        ? "bg-primary text-white"
                        : "bg-white/10 text-slate-500"
                    }`}
                  >
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs ${
                      i <= step ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {STEPS[i]}
                  </span>
                  {i < 3 && <span className="text-slate-600 text-xs">—</span>}
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Configurar Loja</h1>
                  <p className="text-sm text-slate-400 mt-1 text-center">
                    Vamos configurar sua vitrine em poucos passos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Nome do seu negócio</Label>
                  <Input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Ex.: Minha Loja"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    URL da logo
                    <span className="block text-xs text-slate-500">Opcional</span>
                  </Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png ou /uploads/..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => setStep(1)}
                  disabled={!siteName.trim()}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <h1 className="text-2xl font-bold text-white">Escolha seu Nicho</h1>
                  <p className="text-sm text-slate-400 mt-1 text-center">
                    Selecione um template para começar. Você pode personalizar tudo depois.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`relative rounded-xl border p-4 text-left transition-all ${
                        selectedTemplate === tpl.id
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{tpl.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{tpl.name}</p>
                          <p className="text-xs text-slate-400">{tpl.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: tpl.settings.primaryColor }} />
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: tpl.settings.secondaryColor }} />
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: tpl.settings.accentColor }} />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="gap-2 text-slate-300" onClick={() => setStep(0)}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button className="flex-1 gap-2" onClick={() => setStep(2)}>
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <h1 className="text-2xl font-bold text-white">Contato WhatsApp</h1>
                  <p className="text-sm text-slate-400 mt-1 text-center">
                    Seus clientes vão usar esse número para fazer pedidos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">
                    WhatsApp (somente números, com DDI e DDD)
                  </Label>
                  <Input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="5531999999999"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Telefone para exibir no site
                  </Label>
                  <Input
                    value={phoneDisplay}
                    onChange={(e) => setPhoneDisplay(e.target.value)}
                    placeholder="(31) 99999-9999"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="gap-2 text-slate-300" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button className="flex-1 gap-2" onClick={() => setStep(3)} disabled={!whatsappNumber.trim()}>
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Tudo Pronto!</h1>
                  <p className="text-sm text-slate-400 mt-1 text-center">
                    Sua loja está configurada. Agora você pode adicionar produtos e personalizar tudo.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <p className="text-sm text-white">
                    <span className="text-slate-400">Loja:</span> {siteName || "—"}
                  </p>
                  <p className="text-sm text-white">
                    <span className="text-slate-400">Nicho:</span>{" "}
                    {selectedTemplate ? TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "—" : "Nenhum (personalizado)"}
                  </p>
                  <p className="text-sm text-white">
                    <span className="text-slate-400">WhatsApp:</span> {whatsappNumber || "—"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="gap-2 text-slate-300" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleFinish} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      <>
                        Finalizar Configuração
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center mt-4">
          <a href="/admin" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Pular configuração → Ir ao painel
          </a>
        </p>
      </div>
    </div>
  )
}
