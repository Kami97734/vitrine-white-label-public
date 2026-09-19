"use client"

/**
 * /admin/login — Tela de login do administrador (2 etapas)
 *
 * Etapa 1: ADM informa e-mail → sistema envia código OTP
 * Etapa 2: ADM digita o código de 6 dígitos recebido por e-mail
 *
 * Segurança:
 * - Mensagem genérica: nunca revela se o e-mail é admin ou não
 * - Código nunca trafega pelo front-end (apenas via e-mail)
 * - Todas as validações acontecem no servidor (API routes)
 */

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Shield, Mail, ArrowRight, RotateCcw, Loader2, CheckCircle2 } from "lucide-react"
import { useSettings } from "@/components/providers/settings-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Step = "email" | "code"

export default function AdminLoginPage() {
  const router = useRouter()
  const settings = useSettings()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const codeRefs = useRef<(HTMLInputElement | null)[]>([])

  // Timer de reenvio
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  // ── Etapa 1: Solicitar código OTP ──────────────────────────────────────────
  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? "Erro ao solicitar código. Tente novamente.")
        return
      }

      setSuccess(data.message ?? "Se este e-mail estiver autorizado, um código será enviado em instantes.")
      setStep("code")
      setResendTimer(60) // aguarda 60s antes de reenviar
      setCode(["", "", "", "", "", ""])
      setTimeout(() => codeRefs.current[0]?.focus(), 300)
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // ── Etapa 2: Verificar código OTP ──────────────────────────────────────────
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    const fullCode = code.join("")
    if (fullCode.length < 6) {
      setError("Digite os 6 dígitos do código recebido.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/admin/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? "Código inválido ou expirado.")
        setCode(["", "", "", "", "", ""])
        codeRefs.current[0]?.focus()
        return
      }

      // Sucesso — redireciona para o painel (ou setup se for primeira vez)
      if (data.setupRequired) {
        router.push("/admin/setup")
      } else {
        router.push("/admin")
      }
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // ── Input de dígito individual ─────────────────────────────────────────────
  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1)
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    if (digit && index < 5) {
      codeRefs.current[index + 1]?.focus()
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length > 0) {
      e.preventDefault()
      const newCode = [...code]
      pasted.split("").forEach((d, i) => { newCode[i] = d })
      setCode(newCode)
      codeRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  function handleBackToEmail() {
    setStep("email")
    setError(null)
    setSuccess(null)
    setCode(["", "", "", "", "", ""])
  }

  async function handleResend() {
    if (resendTimer > 0) return
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSuccess("Um novo código foi enviado para o seu e-mail.")
        setResendTimer(60)
        setCode(["", "", "", "", "", ""])
        codeRefs.current[0]?.focus()
      } else {
        setError(data.error ?? "Não foi possível reenviar. Tente novamente.")
      }
    } catch {
      setError("Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Card com glassmorphism */}
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Gradiente decorativo */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative p-8">
            {/* Ícone + Título */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
                {settings.adminLogoUrl?.trim() ? (
                  <Image
                    src={settings.adminLogoUrl}
                    alt={settings.adminPanelTitle || "Admin"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <Shield className="h-8 w-8 text-primary" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">
                {settings.adminPanelTitle || "Login Administrativo"}
              </h1>
              <p className="text-sm text-slate-400 mt-1 text-center">
                {step === "email"
                  ? (settings.adminPanelSubtitle || "Acesso restrito a administradores autorizados.")
                  : `Código enviado para ${email}`}
              </p>
            </div>

            {/* Alertas */}
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-500/30 bg-red-500/10">
                <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                <p className="text-green-300 text-sm">{success}</p>
              </div>
            )}

            {/* ── STEP 1: E-mail ─────────────────────────────────────────── */}
            {step === "email" && (
              <form onSubmit={handleRequestCode} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-slate-300 text-sm font-medium">
                    E-mail do administrador
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold gap-2"
                  disabled={loading || !email.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando código...
                    </>
                  ) : (
                    <>
                      Enviar código
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  Acesso exclusivo para administradores cadastrados.
                </p>
              </form>
            )}

            {/* ── STEP 2: Código OTP ─────────────────────────────────────── */}
            {step === "code" && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-slate-300 text-sm font-medium block text-center">
                    Digite o código de 6 dígitos
                  </Label>
                  {/* Inputs individuais por dígito */}
                  <div className="flex gap-2 justify-center" onPaste={handleDigitPaste}>
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { codeRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        className="w-11 h-14 text-center text-xl font-bold rounded-xl border border-white/10 bg-white/5 text-white focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all caret-transparent"
                        aria-label={`Dígito ${i + 1} do código`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center text-slate-500">
                    O código expira em 10 minutos.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold gap-2"
                  disabled={loading || code.join("").length < 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Entrar no painel"
                  )}
                </Button>

                {/* Reenviar e voltar */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Trocar e-mail
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || loading}
                    className="hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0
                      ? `Reenviar em ${resendTimer}s`
                      : "Reenviar código"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Link de volta ao site */}
        <p className="text-center mt-6 text-sm text-slate-500">
          <a href="/" className="hover:text-slate-300 transition-colors">
            ← Voltar ao site
          </a>
        </p>
      </div>
    </div>
  )
}
