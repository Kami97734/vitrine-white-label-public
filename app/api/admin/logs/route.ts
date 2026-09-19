import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

const DEFAULT_TAKE = 50
const MAX_TAKE = 200

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor") ?? undefined
    const actionFilter = searchParams.get("action") ?? undefined
    const entityType = searchParams.get("entityType") ?? undefined
    const result = searchParams.get("result") ?? undefined
    const from = searchParams.get("from") ?? undefined
    const to = searchParams.get("to") ?? undefined
    const format = (searchParams.get("format") ?? "json").toLowerCase()
    const takeParam = Number(searchParams.get("take") ?? DEFAULT_TAKE)
    const take =
      Number.isNaN(takeParam) || takeParam <= 0
        ? DEFAULT_TAKE
        : Math.min(takeParam, MAX_TAKE)

    const where: any = {}
    if (actionFilter) {
      where.action = { contains: actionFilter }
    }
    if (entityType) {
      where.entityType = { contains: entityType }
    }
    if (result) {
      where.result = { equals: result }
    }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const logs = await prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        admin: {
          select: { email: true },
        },
      },
    })

    const hasMore = format === "json" && logs.length > take
    const items = hasMore ? logs.slice(0, -1) : logs
    const nextCursor = hasMore ? items[items.length - 1]?.id : null

    const mapped = items.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      result: log.result,
      source: log.source,
      correlationId: log.correlationId,
      adminEmail: log.admin?.email ?? null,
      details: log.details,
      beforeData: log.beforeData,
      afterData: log.afterData,
      ip: log.ip,
      userAgent: log.userAgent,
      method: log.method,
      path: log.path,
      createdAt: log.createdAt,
    }))

    const csvCell = (val: unknown, maxLen = 800): string => {
      const s = String(val ?? "")
        .replaceAll("\r\n", " ")
        .replaceAll("\n", " ")
        .replaceAll(";", ",")
      return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s
    }

    if (format === "csv") {
      const headers = [
        "id",
        "createdAt",
        "action",
        "entityType",
        "entityId",
        "result",
        "source",
        "correlationId",
        "adminEmail",
        "ip",
        "method",
        "path",
        "details",
        "beforeData",
        "afterData",
      ]
      const rows = [headers.join(";")]
      for (const item of mapped) {
        rows.push(
          headers
            .map((h) => csvCell((item as Record<string, unknown>)[h]))
            .join(";")
        )
      }
      return new NextResponse(rows.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="admin-logs.csv"',
        },
      })
    }

    return NextResponse.json({
      items: mapped,
      nextCursor,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao listar logs" }, { status: 500 })
  }
}

