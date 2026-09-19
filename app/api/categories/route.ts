import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { title: "asc" },
      include: {
        products: {
          include: {
            prices: {
              orderBy: { effectiveAt: "desc" },
              take: 1,
            },
          },
        },
      },
    })
    const withCurrentPrice = categories.map((cat) => ({
      ...cat,
      products: cat.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image,
        price: p.prices[0]?.value ?? 0,
        oldPrice: p.prices[0]?.oldValue ?? undefined,
      })),
    }))
    return NextResponse.json(withCurrentPrice)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao listar categorias" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const body = await request.json()
    const { slug, title } = body
    if (!slug || !title) {
      return NextResponse.json({ error: "slug e title são obrigatórios" }, { status: 400 })
    }
    const category = await prisma.category.create({
      data: { slug: slug.trim(), title: title.trim() },
    })

    console.log("[admin:audit] Categoria criada", {
      adminId: admin.id,
      categoryId: category.id,
      slug: category.slug,
    })

    return NextResponse.json(category)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
  }
}
