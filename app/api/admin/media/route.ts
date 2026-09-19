import { NextRequest, NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import path from "path"
import { getAdminFromRequest } from "@/lib/admin-api"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    let names: string[] = []
    try {
      names = await readdir(UPLOAD_DIR)
    } catch {
      names = []
    }

    const items = await Promise.all(
      names
        .filter((n) => n && !n.startsWith(".") && !n.includes(".."))
        .map(async (name) => {
          const full = path.join(UPLOAD_DIR, name)
          try {
            const st = await stat(full)
            if (!st.isFile()) return null
            return {
              id: name,
              url: `/uploads/${encodeURI(name)}`,
              size: st.size,
              mtime: st.mtime.toISOString(),
            }
          } catch {
            return null
          }
        })
    )

    const filtered = items.filter(Boolean) as Array<{
      id: string
      url: string
      size: number
      mtime: string
    }>

    filtered.sort((a, b) => (a.mtime < b.mtime ? 1 : -1))

    return NextResponse.json({ items: filtered })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao listar mídia" }, { status: 500 })
  }
}
