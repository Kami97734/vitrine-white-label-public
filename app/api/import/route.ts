import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"

function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let current: string[] = []
  let inQuotes = false
  let field = ""
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') inQuotes = false
      else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === "," || c === ";") {
        current.push(field.trim())
        field = ""
      } else if (c === "\n" || c === "\r") {
        if (field || current.length) {
          current.push(field.trim())
          lines.push(current)
          current = []
          field = ""
        }
        if (c === "\r" && text[i + 1] === "\n") i++
      } else field += c
    }
  }
  if (field || current.length) {
    current.push(field.trim())
    lines.push(current)
  }
  return lines
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    })

    const header = ["nome", "descricao", "codigo", "categoria", "preco"]
    const lines = [header.join(";")]

    for (const p of products) {
      const price = p.prices[0]?.value ?? 0
      const row = [
        p.name.replace(/;/g, ","),
        (p.description ?? "").replace(/;/g, ","),
        p.code ?? "",
        p.category?.title ?? "",
        price.toString().replace(".", ","),
      ]
      lines.push(row.join(";"))
    }

    const csv = lines.join("\n")
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="produtos.csv"',
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao exportar CSV" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo CSV não enviado" }, { status: 400 })
    }
    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV deve ter cabeçalho e ao menos uma linha" }, { status: 400 })
    }
    const header = rows[0].map((h) => h.toLowerCase().replace(/\s/g, ""))
    const nameIdx = header.indexOf("nome") >= 0 ? header.indexOf("nome") : 0
    const descIdx = header.indexOf("descricao") >= 0 ? header.indexOf("descricao") : 1
    const codeIdx = header.indexOf("codigo") >= 0 ? header.indexOf("codigo") : -1
    const catIdx = header.indexOf("categoria") >= 0 ? header.indexOf("categoria") : 2
    const priceIdx = header.indexOf("preco") >= 0 ? header.indexOf("preco") : 3

    const categories = await prisma.category.findMany()
    const categoryByTitle = new Map(categories.map((c) => [c.title.toLowerCase(), c]))
    const categoryBySlug = new Map(categories.map((c) => [c.slug.toLowerCase(), c]))

    let created = 0
    let updated = 0
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const name = row[nameIdx]?.trim()
      if (!name) continue
      const description = row[descIdx]?.trim() ?? ""
      const code = codeIdx >= 0 ? row[codeIdx]?.trim() || null : null
      const catStr = row[catIdx]?.trim() ?? ""
      const priceNum = parseFloat(String(row[priceIdx] ?? "0").replace(",", "."))
      let categoryId: string | null = null
      if (catStr) {
        const cat = categoryByTitle.get(catStr.toLowerCase()) ?? categoryBySlug.get(catStr.toLowerCase())
        if (cat) categoryId = cat.id
      }
      if (!categoryId && categories.length) categoryId = categories[0].id
      if (!categoryId) continue

      const existing = code
        ? await prisma.product.findUnique({ where: { code } })
        : null
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name,
            description,
            image: existing.image,
          },
        })
        if (!Number.isNaN(priceNum) && priceNum >= 0) {
          await prisma.price.create({
            data: { productId: existing.id, value: priceNum },
          })
        }
        updated++
      } else {
        const product = await prisma.product.create({
          data: {
            code,
            name,
            description,
            image: "/images/placeholder.jpg",
            categoryId,
          },
        })
        if (!Number.isNaN(priceNum) && priceNum >= 0) {
          await prisma.price.create({
            data: { productId: product.id, value: priceNum },
          })
        }
        created++
      }
    }

    console.log("[admin:audit] Importação CSV concluída", {
      adminId: admin.id,
      created,
      updated,
    })

    return NextResponse.json({ ok: true, created, updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao importar CSV" }, { status: 500 })
  }
}
