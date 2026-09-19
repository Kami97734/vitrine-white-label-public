import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { code, cartTotal } = await request.json()
    if (!code) return NextResponse.json({ error: "Código obrigatório" }, { status: 400 })

    const rows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT * FROM Coupon WHERE code = ?",
      String(code).trim().toUpperCase()
    )

    const coupon = rows[0]
    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido" }, { status: 404 })
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return NextResponse.json({ error: "Cupom expirado" }, { status: 400 })
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 })
    }

    const value = Number(cartTotal ?? 0)
    if (coupon.minValue > 0 && value < coupon.minValue) {
      return NextResponse.json(
        { error: `Valor mínimo: R$ ${Number(coupon.minValue).toFixed(2)}` },
        { status: 400 }
      )
    }

    const discountValue = value * (Number(coupon.discount) / 100)
    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount: Number(coupon.discount),
      discountValue: Math.round(discountValue * 100) / 100,
      totalAfterDiscount: Math.round((value - discountValue) * 100) / 100,
    })
  } catch {
    return NextResponse.json({ error: "Erro ao validar cupom" }, { status: 500 })
  }
}
