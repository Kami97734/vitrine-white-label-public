import { NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import path from "path"
import { getAdminFromRequest } from "@/lib/admin-api"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request)
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params

  // Sanitização: previne path traversal
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const filePath = path.join(UPLOAD_DIR, id)

  // Garante que o arquivo está dentro do diretório de uploads
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    await unlink(filePath)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException
    if (err.code === "ENOENT") {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
    }
    console.error("[upload/delete]", e)
    return NextResponse.json({ error: "Erro ao excluir arquivo" }, { status: 500 })
  }
}
