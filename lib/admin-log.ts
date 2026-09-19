import type { NextRequest } from "next/server"
import { prisma } from "./prisma"

interface AdminLogParams {
  adminId?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  result?: "success" | "failed" | "warning" | string | null
  source?: string | null
  correlationId?: string | null
  beforeData?: Record<string, unknown> | null
  afterData?: Record<string, unknown> | null
  details?: Record<string, unknown> | null
  request?: NextRequest
}

export async function createAdminLog(params: AdminLogParams) {
  const {
    adminId,
    action,
    entityType,
    entityId,
    result,
    source,
    correlationId,
    beforeData,
    afterData,
    details,
    request,
  } = params

  try {
    const ipHeader =
      request?.headers.get("x-forwarded-for") ??
      request?.headers.get("x-real-ip") ??
      null
    const ip = ipHeader?.split(",")[0]?.trim() || null
    const path = request?.nextUrl.pathname ?? null
    const userAgent = request?.headers.get("user-agent") ?? null
    const method = request?.method ?? null

    await prisma.adminLog.create({
      data: {
        adminId: adminId ?? null,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        result: result ?? "success",
        source: source ?? "admin-panel",
        correlationId: correlationId ?? null,
        beforeData: beforeData ? JSON.stringify(beforeData) : null,
        afterData: afterData ? JSON.stringify(afterData) : null,
        details: details ? JSON.stringify(details) : null,
        ip,
        userAgent,
        method,
        path,
      },
    })
  } catch (e) {
    // Não quebra a requisição se o log falhar
    console.error("[admin-log] erro ao registrar log", e)
  }
}

