import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { createAdminLog } from "@/lib/admin-log"

// GET /api/admin/orders — lista todos os pedidos
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") ?? undefined
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20

  try {
    const where = status ? { status } : {}

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, limit })
  } catch (e) {
    console.error("[admin/orders GET]", e)
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
  }
}

// POST /api/admin/orders — cria pedido manualmente
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const body = await request.json()
    const { customerName, customerPhone, customerEmail, channel, notes, items } = body as {
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      channel?: string
      notes?: string
      items?: { productId: string; quantity: number; unitPrice: number }[]
    }

    if (!customerName || !customerPhone || !items?.length) {
      return NextResponse.json(
        { error: "Nome, telefone e itens são obrigatórios" },
        { status: 400 }
      )
    }

    const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

    const order = await prisma.order.create({
      data: {
        customerName,
        customerPhone,
        customerEmail: customerEmail ?? null,
        channel: channel ?? "whatsapp",
        notes: notes ?? null,
        totalAmount,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: { items: true },
    })

    await createAdminLog({
      adminId: admin.id,
      action: "admin.order.create",
      entityType: "Order",
      entityId: order.id,
      result: "success",
      details: { customerName, totalAmount },
      request,
    })

    return NextResponse.json(order, { status: 201 })
  } catch (e) {
    console.error("[admin/orders POST]", e)
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
  }
}
