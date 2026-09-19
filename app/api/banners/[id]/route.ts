import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const banner = await prisma.banner.findUnique({ where: { id } })
  if (!banner) return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 })
  return NextResponse.json(banner)
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
    const { title, imageUrl, linkUrl, sortOrder } = body
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title != null && { title: String(title).trim() }),
        ...(imageUrl != null && { imageUrl: String(imageUrl).trim() }),
        ...(linkUrl != null && { linkUrl: String(linkUrl).trim() }),
        ...(sortOrder != null && { sortOrder: Number(sortOrder) ?? 0 }),
      },
    })

    console.log("[admin:audit] Banner atualizado", {
      adminId: admin.id,
      bannerId: banner.id,
      title: banner.title,
    })

    return NextResponse.json(banner)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao atualizar banner" }, { status: 500 })
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
    const deleted = await prisma.banner.delete({ where: { id } })

    console.log("[admin:audit] Banner excluído", {
      adminId: admin.id,
      bannerId: id,
      title: deleted.title,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao excluir banner" }, { status: 500 })
  }
}
