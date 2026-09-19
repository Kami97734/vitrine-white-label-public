import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        label: true,
        slugOrUrl: true,
        position: true,
        order: true,
        visible: true,
      },
    })
    return NextResponse.json(items)
  } catch {
    return NextResponse.json([])
  }
}
