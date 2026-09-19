import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, title: true, slug: true } },
        prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const price = product.prices[0]?.value ?? 0
    const oldPrice = product.prices[0]?.oldValue ?? null

    let images: string[] = []
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images)
        if (Array.isArray(parsed)) images = parsed
      } catch {
        images = []
      }
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      images,
      code: product.code,
      unitQuantity: product.unitQuantity,
      unitMeasure: product.unitMeasure,
      costPrice: product.costPrice,
      sku: product.sku,
      barcode: product.barcode,
      stock: product.stock,
      price,
      oldPrice,
      category: product.category,
    })
  } catch (e) {
    console.error("[api/products/[id]]", e)
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const {
      name,
      description,
      image,
      images,
      categoryId,
      price,
      code,
      unitQuantity,
      unitMeasure,
      costPrice,
      sku,
      barcode,
      stock,
    } = body

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const parseNum = (v: unknown) => {
      if (v == null || v === "") return null
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."))
      return Number.isNaN(n) ? null : n
    }

    const imagesJson =
      Array.isArray(images) && images.length > 0
        ? JSON.stringify(images.map((u: string) => String(u)))
        : existing.images

    await prisma.product.update({
      where: { id },
      data: {
        name: name != null ? String(name).trim() : existing.name,
        description: description != null ? String(description).trim() : existing.description,
        image: image != null && String(image).trim() ? String(image).trim() : existing.image,
        images: imagesJson,
        categoryId: categoryId != null ? String(categoryId) : existing.categoryId,
        unitQuantity: parseNum(unitQuantity) ?? existing.unitQuantity,
        unitMeasure: unitMeasure != null && String(unitMeasure).trim() ? String(unitMeasure).trim() : existing.unitMeasure,
        costPrice: parseNum(costPrice) ?? existing.costPrice,
        sku: sku != null && String(sku).trim() ? String(sku).trim() : existing.sku,
        barcode:
          barcode != null && String(barcode).trim() !== ""
            ? String(barcode).trim()
            : barcode === ""
              ? null
              : existing.barcode,
        code:
          code != null
            ? String(code).trim() !== ""
              ? String(code).trim()
              : null
            : existing.code,
        stock: stock != null ? parseInt(String(stock), 10) || -1 : existing.stock,
      },
    })

    if (price != null) {
      const value = parseNum(price)
      if (value != null && value >= 0) {
        const current = await prisma.price.findFirst({
          where: { productId: id },
          orderBy: { effectiveAt: "desc" },
          select: { value: true },
        })
        const oldVal = current?.value
        await prisma.price.create({
          data: {
            productId: id,
            value,
            oldValue: oldVal != null && oldVal !== value ? oldVal : undefined,
          },
        })
      }
    }

    const withPrice = await prisma.product.findUnique({
      where: { id },
      include: { category: true, prices: { orderBy: { effectiveAt: "desc" }, take: 1 } },
    })

    return NextResponse.json({
      ...withPrice,
      price: withPrice?.prices[0]?.value ?? 0,
      oldPrice: withPrice?.prices[0]?.oldValue ?? undefined,
    })
  } catch (e) {
    console.error("[api/products/[id]] PUT", e)
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request)
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  try {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/products/[id]] DELETE", e)
    return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 500 })
  }
}
