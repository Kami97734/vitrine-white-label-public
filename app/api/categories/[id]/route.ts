import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
          },
        },
      },
    })
    if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    const withPrice = {
      ...category,
      products: category.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image,
        price: p.prices[0]?.value ?? 0,
        oldPrice: p.prices[0]?.oldValue ?? undefined,
      })),
    }
    return NextResponse.json(withPrice)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao buscar categoria" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const { slug, title } = body
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(slug != null && { slug: String(slug).trim() }),
        ...(title != null && { title: String(title).trim() }),
      },
    })

    console.log("[admin:audit] Categoria atualizada", {
      adminId: admin.id,
      categoryId: category.id,
      slug: category.slug,
    })

    return NextResponse.json(category)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const { id } = await params
    const deleted = await prisma.category.delete({ where: { id } })

    console.log("[admin:audit] Categoria excluída", {
      adminId: admin.id,
      categoryId: id,
      slug: deleted.slug,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 })
  }
}
