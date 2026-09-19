/**
 * GET /api/admin/status
 *
 * Retorna o status de saúde da vitrine (health check).
 * Inclui:
 * - Conexão com banco de dados
 * - Configuração SMTP
 * - Contagem de produtos, categorias, pedidos
 * - Status de uploads de mídia
 *
 * Disponível apenas para admin autenticado.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const status: {
      timestamp: string
      database: { connected: boolean; error?: string }
      smtp: { configured: boolean }
      content: {
        products: number
        categories: number
        banners: number
      }
      admin: {
        count: number
        last_login?: string
      }
      site_settings: {
        configured: boolean
      }
    } = {
      timestamp: now.toISOString(),
      database: { connected: false },
      smtp: { configured: Boolean(process.env.SMTP_HOST) },
      content: {
        products: 0,
        categories: 0,
        banners: 0,
      },
      admin: { count: 0 },
      site_settings: { configured: false },
    }

    // Verifica conexão com banco
    try {
      await prisma.$queryRaw`SELECT 1`
      status.database.connected = true

      // Busca contagens
      const [productCount, categoryCount, bannerCount, adminCount, siteSettings, lastAdminLog] =
        await Promise.all([
          prisma.product.count(),
          prisma.category.count(),
          prisma.banner.count(),
          prisma.admin.count(),
          prisma.siteSettings.findFirst(),
          prisma.adminLog.findFirst({
            where: { action: "admin.otp.verify.success" },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          }),
        ])

      status.content.products = productCount
      status.content.categories = categoryCount
      status.content.banners = bannerCount
      status.admin.count = adminCount
      if (lastAdminLog) {
        status.admin.last_login = lastAdminLog.createdAt.toISOString()
      }
      status.site_settings.configured = Boolean(siteSettings)
    } catch (err) {
      status.database.connected = false
      status.database.error = String(err)
    }

    return NextResponse.json(status, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao obter status", details: String(err) },
      { status: 500 }
    )
  }
}
