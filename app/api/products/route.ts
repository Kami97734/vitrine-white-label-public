import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const categorySlug = searchParams.get("category")
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "200", 10) || 200, 1), 500)
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0)
    const search = searchParams.get("search")?.trim()

    const where: Record<string, unknown> = {}
    if (categoryId) where.categoryId = categoryId
    if (categorySlug) where.category = { slug: categorySlug }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: Object.keys(where).length ? where : undefined,
        include: {
          category: true,
          prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
        },
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where: Object.keys(where).length ? where : undefined }),
    ])
    const list = products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      image: p.image,
      images: p.images ? (JSON.parse(p.images) as string[]) : [],
      categoryId: p.categoryId,
      category: p.category,
      unitQuantity: p.unitQuantity,
      unitMeasure: p.unitMeasure,
      costPrice: p.costPrice,
      sku: p.sku,
      barcode: p.barcode,
      stock: p.stock,
      price: p.prices[0]?.value ?? 0,
      oldPrice: p.prices[0]?.oldValue ?? undefined,
    }))
    return NextResponse.json({ products: list, total, limit, offset })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao listar produtos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const body = await request.json()
    const {
      name,
      description,
      image,
      images,
      categoryId,
      price,
      oldPrice,
      code,
      unitQuantity,
      unitMeasure,
      costPrice,
      sku,
      barcode,
      stock,
    } = body
    if (!name || !categoryId) {
      return NextResponse.json({ error: "name e categoryId são obrigatórios" }, { status: 400 })
    }
    const mainImage = (String(image ?? "").trim()) || "/images/placeholder.jpg"
    const imagesJson =
      Array.isArray(images) && images.length > 0
        ? JSON.stringify(images.map((u: string) => String(u)))
        : null

    const parseNum = (v: unknown) => {
      if (v == null || v === "") return null
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."))
      return Number.isNaN(n) ? null : n
    }

    const product = await prisma.product.create({
      data: {
        code: code != null && String(code).trim() !== "" ? String(code).trim() : null,
        name: String(name).trim(),
        description: String(description ?? "").trim(),
        image: mainImage,
        images: imagesJson,
        categoryId: String(categoryId),
        unitQuantity: parseNum(unitQuantity) ?? 1,
        unitMeasure: unitMeasure ? String(unitMeasure).trim() : "un",
        costPrice: parseNum(costPrice) ?? 0,
        sku: sku != null && String(sku).trim() !== "" ? String(sku).trim() : `AUTO-${Date.now()}`,
        barcode: barcode != null && String(barcode).trim() !== "" ? String(barcode).trim() : null,
        stock: stock != null ? parseInt(String(stock), 10) || -1 : -1,
      },
    })
    const value = typeof price === "number" ? price : parseFloat(price)
    if (!Number.isNaN(value) && value >= 0) {
      await prisma.price.create({
        data: {
          productId: product.id,
          value,
          oldValue: oldPrice != null ? (typeof oldPrice === "number" ? oldPrice : parseFloat(oldPrice)) : undefined,
        },
      })
    }
    const withPrice = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
      },
    })
    console.log("[admin:audit] Produto criado", {
      adminId: admin.id,
      productId: product.id,
      code: product.code,
      categoryId: product.categoryId,
    })

    return NextResponse.json({
      ...withPrice,
      price: withPrice?.prices[0]?.value ?? 0,
      oldPrice: withPrice?.prices[0]?.oldValue ?? undefined,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 })
  }
}
