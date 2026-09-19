import { NextRequest, NextResponse } from "next/server"
import { getAdminFromRequest } from "@/lib/admin-api"
import { randomBytes } from "crypto"

// Suporte a múltiplos providers de upload
// LOCAL  → salva em public/uploads/ (apenas dev)
// CLOUDINARY → usa Cloudinary
// UPLOADTHING → usa Uploadthing
const UPLOAD_PROVIDER = process.env.UPLOAD_PROVIDER || "local"

function getExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(`.${ext}`)) return ext
  return "jpg"
}

async function uploadToLocal(file: File, id: string): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises")
  const path = await import("path")
  const uploadDir = path.default.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })
  const filePath = path.default.join(uploadDir, id)
  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))
  return `/uploads/${id}`
}

async function uploadToCloud(file: File, id: string): Promise<string> {
  // Placeholder para integração com Cloudinary/Uploadthing/S3
  // Exemplo Cloudinary:
  // const cloudinary = await import("cloudinary")
  // cloudinary.v2.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, ... })
  // const buffer = Buffer.from(await file.arrayBuffer())
  // const b64 = buffer.toString("base64")
  // const result = await cloudinary.v2.uploader.upload(`data:${file.type};base64,${b64}`, { public_id: id })
  // return result.secure_url
  throw new Error(`Upload provider "${UPLOAD_PROVIDER}" não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no .env`)
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const ext = getExtension(file.name)
    const id = `${randomBytes(8).toString("hex")}.${ext}`

    let url: string
    if (UPLOAD_PROVIDER === "local" && process.env.NODE_ENV !== "production") {
      url = await uploadToLocal(file, id)
    } else if (UPLOAD_PROVIDER === "cloudinary") {
      url = await uploadToCloud(file, id)
    } else {
      return NextResponse.json(
        { error: `Upload provider "${UPLOAD_PROVIDER}" não suportado. Use "local" (dev) ou "cloudinary" (prod).` },
        { status: 400 }
      )
    }

    return NextResponse.json({ id, url })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 })
  }
}
