/**
 * admin-login-store.ts
 *
 * Gerencia os códigos OTP de login do admin diretamente no banco de dados.
 * - Código nunca é armazenado em texto puro (apenas hash bcrypt)
 * - Expiração persistida no banco (não perde em restart do servidor)
 * - Controle de tentativas por código (máximo 5 tentativas)
 *
 * MIGRAÇÃO FUTURA: Para produção de alto volume, substitua por Redis
 * com TTL automático e rate limit distribuído (ex.: Upstash Redis).
 */

import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

const CODE_LIFETIME_MS = 10 * 60 * 1000 // 10 minutos
const MAX_CODE_ATTEMPTS = 5              // tentativas erradas antes de invalidar

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Gera um código OTP de 6 dígitos, salva o hash no banco e retorna o código
 * em texto puro (apenas para enviar por e-mail — nunca exposto no front-end).
 */
export async function createAdminLoginCode(email: string): Promise<string> {
  const normalized = normalizeEmail(email)

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const codeHash = await bcrypt.hash(code, 10)
  const expiresAt = new Date(Date.now() + CODE_LIFETIME_MS)
  const expiresAtISO = expiresAt.toISOString()

  const admin = await prisma.admin.findUnique({ where: { email: normalized } })

  await prisma.adminOtpCode.updateMany({
    where: { email: normalized, used: false },
    data: { used: true },
  })

  await prisma.adminOtpCode.create({
    data: {
      email: normalized,
      codeHash,
      expiresAt: expiresAtISO,
      adminId: admin?.id ?? null,
    },
  })

  return code
}

/**
 * Verifica se o código OTP informado é válido para o e-mail.
 * Retorna true apenas se: código correto + não expirado + não usado + tentativas < máx.
 * Incrementa tentativas a cada falha e invalida o código se atingir o limite.
 */
export async function verifyAdminLoginCode(
  email: string,
  code: string
): Promise<boolean> {
  const normalized = normalizeEmail(email)
  const now = new Date()

  // Busca o código mais recente não usado e não expirado
  const otpRecord = await prisma.adminOtpCode.findFirst({
    where: {
      email: normalized,
      used: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!otpRecord) return false

  // Verifica se já atingiu o limite de tentativas
  if (otpRecord.attempts >= MAX_CODE_ATTEMPTS) {
    await prisma.adminOtpCode.update({
      where: { id: otpRecord.id },
      data: { used: true }, // invalida definitivamente
    })
    return false
  }

  const trimmed = code.trim()
  const match = await bcrypt.compare(trimmed, otpRecord.codeHash)

  if (!match) {
    await prisma.adminOtpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    })
    return false
  }

  // Código correto — marca como usado para não reutilizar
  await prisma.adminOtpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  })

  return true
}

/**
 * Limpa códigos OTP expirados do banco (pode ser chamado periodicamente).
 * Em produção, use um cron job ou worker para manter o banco limpo.
 */
export async function cleanExpiredOtpCodes(): Promise<void> {
  await prisma.adminOtpCode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
