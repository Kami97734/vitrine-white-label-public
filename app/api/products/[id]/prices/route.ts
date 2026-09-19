import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    const prices = await prisma.price.findMany({
      where: { productId: id },
      orderBy: { effectiveAt: "desc" },
    })
    return NextResponse.json(prices)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao listar preços" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    const body = await request.json()
    const { value, oldValue } = body
    const numValue = typeof value === "number" ? value : parseFloat(value)
    if (Number.isNaN(numValue) || numValue < 0) {
      return NextResponse.json({ error: "value inválido" }, { status: 400 })
    }
    const price = await prisma.price.create({
      data: {
        productId: id,
        value: numValue,
        oldValue:
          oldValue != null
            ? typeof oldValue === "number"
              ? oldValue
              : parseFloat(oldValue)
            : undefined,
      },
    })
    return NextResponse.json(price)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao criar preço" }, { status: 500 })
  }
}
