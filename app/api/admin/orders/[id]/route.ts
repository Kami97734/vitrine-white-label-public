import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { createAdminLog } from "@/lib/admin-log"

// PATCH /api/admin/orders/[id] — atualiza status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const { status, notes } = body as { status?: string; notes?: string }

    const validStatuses = ["pending", "confirmed", "cancelled", "paid"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    })

    await createAdminLog({
      adminId: admin.id,
      action: "admin.order.update",
      entityType: "Order",
      entityId: id,
      result: "success",
      details: { status, notes },
      beforeData: { status: existing.status },
      afterData: { status: updated.status },
      request,
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error("[admin/orders/[id] PATCH]", e)
    return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
  }
}

// DELETE /api/admin/orders/[id] — remove pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  try {
    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

    await prisma.order.delete({ where: { id } })

    await createAdminLog({
      adminId: admin.id,
      action: "admin.order.delete",
      entityType: "Order",
      entityId: id,
      result: "success",
      details: { customerName: existing.customerName },
      request,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[admin/orders/[id] DELETE]", e)
    return NextResponse.json({ error: "Erro ao excluir pedido" }, { status: 500 })
  }
}
