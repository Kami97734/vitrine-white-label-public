import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

export async function GET() {
  const banners = await prisma.banner.findMany({
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(banners)
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const body = await request.json()
    const { title, imageUrl, linkUrl, sortOrder } = body
    if (!title || !imageUrl || !linkUrl) {
      return NextResponse.json(
        { error: "title, imageUrl e linkUrl são obrigatórios" },
        { status: 400 }
      )
    }
    const banner = await prisma.banner.create({
      data: {
        title: String(title).trim(),
        imageUrl: String(imageUrl).trim(),
        linkUrl: String(linkUrl).trim(),
        sortOrder: typeof sortOrder === "number" ? sortOrder : Number(sortOrder) || 0,
      },
    })

    console.log("[admin:audit] Banner criado", {
      adminId: admin.id,
      bannerId: banner.id,
      title: banner.title,
    })

    return NextResponse.json(banner)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao criar banner" }, { status: 500 })
  }
}
