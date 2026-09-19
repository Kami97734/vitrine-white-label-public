/**
 * POST /api/admin/login
 *
 * Etapa 1 do login ADM: recebe { email } e envia um código OTP por e-mail.
 *
 * Segurança:
 * - Rate limit por IP (5 req / 15min)
 * - Rate limit por e-mail (3 req / 10min) — evita spam de envio
 * - Resposta genérica: não revela se o e-mail existe ou não
 * - Código gerado e armazenado apenas como hash no banco
 * - Código nunca é exposto no front-end ou em logs de produção
 *
 * MIGRAÇÃO FUTURA: Substitua Nodemailer por Resend, SendGrid ou Amazon SES
 * para melhor entregabilidade em produção.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAdminLoginCode } from "@/lib/admin-login-store"
import { sendAdminLoginCodeEmail } from "@/lib/mail"
import { createAdminLog } from "@/lib/admin-log"

// ── Rate limit por IP ────────────────────────────────────────────────────────
const MAX_IP_ATTEMPTS = 5
const IP_WINDOW_MS = 15 * 60 * 1000 // 15 minutos

type AttemptInfo = { count: number; firstAttemptAt: number }
const attemptsByIp = new Map<string, AttemptInfo>()

// ── Rate limit por e-mail (anti-spam) ────────────────────────────────────────
const MAX_EMAIL_SENDS = 3
const EMAIL_WINDOW_MS = 10 * 60 * 1000 // 10 minutos
const sendsByEmail = new Map<string, AttemptInfo>()

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return (request as unknown as { ip?: string }).ip ?? "unknown"
}

function checkAndRegister(
  map: Map<string, AttemptInfo>,
  key: string,
  max: number,
  windowMs: number
): { blocked: boolean } {
  const useMemory = process.env.NODE_ENV === "development" || process.env.RATE_LIMIT_MEMORY === "true"
  if (useMemory) return { blocked: false }

  const now = Date.now()
  const info = map.get(key)

  if (!info || now - info.firstAttemptAt > windowMs) {
    map.set(key, { count: 1, firstAttemptAt: now })
    return { blocked: false }
  }

  if (info.count >= max) return { blocked: true }

  info.count += 1
  map.set(key, info)
  return { blocked: false }
}

// Mensagem genérica — nunca revelamos se o e-mail é admin ou não
const GENERIC_MSG =
  "Se este e-mail estiver autorizado, um código será enviado em instantes."

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  // Rate limit por IP
  const ipCheck = checkAndRegister(attemptsByIp, ip, MAX_IP_ATTEMPTS, IP_WINDOW_MS)
  if (ipCheck.blocked) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { email } = body as { email?: string }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()

    // Rate limit por e-mail
    const emailCheck = checkAndRegister(
      sendsByEmail,
      normalized,
      MAX_EMAIL_SENDS,
      EMAIL_WINDOW_MS
    )
    if (emailCheck.blocked) {
      // Retornamos a mensagem genérica — não revelamos que está bloqueado
      return NextResponse.json({ message: GENERIC_MSG })
    }

    // Verifica se é um admin ativo no banco (server-side apenas)
    const admin = await prisma.admin.findUnique({
      where: { email: normalized },
    })

    if (!admin) {
      // Loga a tentativa, mas retorna mensagem genérica
      await createAdminLog({
        adminId: null,
        action: "admin.otp.request.unknown_email",
        result: "failed",
        details: { ip, email: normalized },
        request,
      })
      // Resposta idêntica ao caso de sucesso — anti-enumeração
      return NextResponse.json({ message: GENERIC_MSG })
    }

    // Gera OTP e salva hash no banco
    const code = await createAdminLoginCode(normalized)

    // Envia código por e-mail (Nodemailer / Gmail SMTP)
    await sendAdminLoginCodeEmail(normalized, code)

    await createAdminLog({
      adminId: admin.id,
      action: "admin.otp.request.sent",
      result: "success",
      details: { ip, email: normalized },
      request,
    })

    return NextResponse.json({ message: GENERIC_MSG })
  } catch (err) {
    console.error("[admin/login] erro ao solicitar OTP:", err)
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 }
    )
  }
}
