/**
 * POST /api/admin/login/verify
 *
 * Etapa 2 do login ADM: recebe { email, code } e valida o OTP.
 *
 * Segurança:
 * - Rate limit por IP (5 req / 15min)
 * - Validação do hash bcrypt no banco (não compara texto puro)
 * - Controle de tentativas por código (máx 5 no próprio registro)
 * - Código invalidado após uso bem-sucedido
 * - Cookie httpOnly + Secure em produção
 * - Log de auditoria de todas as tentativas
 *
 * MIGRAÇÃO FUTURA: Adicione 2FA real (TOTP/FIDO2) usando bibliotecas
 * como `otplib` ou serviços como Twilio Verify, Auth0 MFA ou Clerk.
 */

// NOTA: Rate-limit em memória NÃO funciona no Vercel serverless.
// Para produção, substitua por Upstash Redis (ver @upstash/redis + @upstash/ratelimit)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAdminToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/admin-auth"
import { verifyAdminLoginCode } from "@/lib/admin-login-store"
import { createAdminLog } from "@/lib/admin-log"

// ── Rate limit por IP ────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos

type AttemptInfo = { count: number; firstAttemptAt: number }
const attemptsByIp = new Map<string, AttemptInfo>()

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return (request as unknown as { ip?: string }).ip ?? "unknown"
}

function isRateLimited(ip: string): boolean {
  if (process.env.NODE_ENV === "development" || process.env.RATE_LIMIT_MEMORY === "true") return false
  const now = Date.now()
  const info = attemptsByIp.get(ip)
  if (!info) return false
  if (now - info.firstAttemptAt > WINDOW_MS) {
    attemptsByIp.delete(ip)
    return false
  }
  return info.count >= MAX_ATTEMPTS
}

function registerFailedAttempt(ip: string) {
  const now = Date.now()
  const info = attemptsByIp.get(ip)
  if (!info || now - info.firstAttemptAt > WINDOW_MS) {
    attemptsByIp.set(ip, { count: 1, firstAttemptAt: now })
    return
  }
  info.count += 1
  attemptsByIp.set(ip, info)
}

function resetAttempts(ip: string) {
  attemptsByIp.delete(ip)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { email, code } = body as { email?: string; code?: string }

    if (
      !email ||
      !code ||
      typeof email !== "string" ||
      typeof code !== "string"
    ) {
      registerFailedAttempt(ip)
      return NextResponse.json(
        { error: "E-mail e código são obrigatórios." },
        { status: 400 }
      )
    }

    const normalized = email.trim().toLowerCase()

    // Verifica o admin no banco
    const admin = await prisma.admin.findUnique({
      where: { email: normalized },
    })

    if (!admin) {
      registerFailedAttempt(ip)
      await createAdminLog({
        adminId: null,
        action: "admin.otp.verify.unknown_email",
        result: "failed",
        details: { ip, email: normalized },
        request,
      })
      // Mesma mensagem para não revelar se e-mail existe
      return NextResponse.json(
        { error: "Código inválido ou expirado." },
        { status: 401 }
      )
    }

    // Validação do código OTP
    const valid = await verifyAdminLoginCode(normalized, code)

    if (!valid) {
      registerFailedAttempt(ip)
      await createAdminLog({
        adminId: admin.id,
        action: "admin.otp.verify.invalid_code",
        result: "failed",
        details: { ip, email: normalized },
        request,
      })
      return NextResponse.json(
        { error: "Código inválido ou expirado." },
        { status: 401 }
      )
    }

    // Sucesso — gera token JWT e seta cookie httpOnly
    resetAttempts(ip)
    const token = await createAdminToken(admin.id)

    const res = NextResponse.json({ ok: true, setupRequired: !(admin as any).setupCompleted })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    await createAdminLog({
      adminId: admin.id,
      action: "admin.otp.verify.success",
      result: "success",
      details: { ip, email: normalized },
      request,
    })

    return res
  } catch (err) {
    console.error("[admin/login/verify] erro:", err)
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 }
    )
  }
}
