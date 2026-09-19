import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { writeFile, mkdir } from "fs/promises"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/admin-api"
import { createAdminLog } from "@/lib/admin-log"

type ImportItem = {
  name: string
  description?: string
  code?: string | null
  category?: string
  price?: number | string | null
  image?: string | null
  unitQuantity?: number | string | null
  unitMeasure?: string | null
  costPrice?: number | string | null
  sku?: string | null
  barcode?: string | null
}

type CatalogConfig = {
  banners?: Array<{ title: string; imageUrl: string; linkUrl: string; sortOrder?: number }>
  home?: Record<string, string>
  homeSections?: Array<{ key: string; type?: string; value: string; sortOrder?: number }>
  menu?: {
    items?: Array<{
      id?: string
      label: string
      slugOrUrl: string
      position?: string
      order?: number
      visible?: boolean
      targetType?: string
      categoryId?: string | null
    }>
  }
  settings?: Record<string, unknown>
}

function parseFloatPT(value: string): number {
  // Remove espaços e troca decimal "," por "."
  return parseFloat(value.trim().replace(",", "."))
}

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/\s/g, "").replace(/[()]/g, "")
}

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

function fileBaseName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "")
  return withoutExt.trim()
}

function slugify(input: string): string {
  const s = input
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
  return s
}

function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) return ext
  return ".jpg"
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

async function uploadFile(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true })
  const ext = getExtension(file.name)
  const id = randomBytes(8).toString("hex") + ext
  const filePath = path.join(UPLOAD_DIR, id)

  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  return `/uploads/${id}`
}

function parseCSVToItems(text: string): ImportItem[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []

  const header = rows[0].map((h) => normalizeHeader(h))
  const nameIdx = header.indexOf("nome") >= 0 ? header.indexOf("nome") : 0
  const descIdx = header.indexOf("descricao") >= 0 ? header.indexOf("descricao") : 1
  const codeIdx = header.indexOf("codigo") >= 0 ? header.indexOf("codigo") : -1
  const catIdx = header.indexOf("categoria") >= 0 ? header.indexOf("categoria") : 2
  const priceIdx = header.indexOf("preco") >= 0 ? header.indexOf("preco") : 3
  const imageIdx = header.indexOf("imagem") >= 0 ? header.indexOf("imagem") : header.indexOf("image")
  const unitQtyIdx = header.indexOf("quantidade") >= 0 ? header.indexOf("quantidade") : header.indexOf("unidadeqtd")
  const unitMeasureIdx = header.indexOf("unidadedemedida") >= 0 ? header.indexOf("unidadedemedida") : header.indexOf("medida")
  const costIdx = header.indexOf("custo") >= 0 ? header.indexOf("custo") : -1
  const skuIdx = header.indexOf("sku") >= 0 ? header.indexOf("sku") : -1
  const barcodeIdx = header.indexOf("codigobarras") >= 0 ? header.indexOf("codigobarras") : header.indexOf("barcode")

  const items: ImportItem[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[nameIdx]?.trim()
    if (!name) continue

    const description = row[descIdx]?.trim() ?? ""
    const code = codeIdx >= 0 ? row[codeIdx]?.trim() || null : null
    const category = catIdx >= 0 ? row[catIdx]?.trim() ?? "" : ""
    const priceRaw = priceIdx >= 0 ? row[priceIdx] : null
    const image = imageIdx >= 0 ? row[imageIdx]?.trim() || null : null

    const numOrNull = (v: string | undefined) => {
      if (v == null || v.trim() === "") return null
      const n = parseFloat(v.replace(",", "."))
      return Number.isNaN(n) ? null : n
    }

    items.push({
      name,
      description,
      code,
      category,
      price: priceRaw,
      image,
      unitQuantity: unitQtyIdx >= 0 ? numOrNull(row[unitQtyIdx]) : null,
      unitMeasure: unitMeasureIdx >= 0 ? (row[unitMeasureIdx]?.trim() || "un") : "un",
      costPrice: costIdx >= 0 ? numOrNull(row[costIdx]) : null,
      sku: skuIdx >= 0 ? row[skuIdx]?.trim() || null : null,
      barcode: barcodeIdx >= 0 ? row[barcodeIdx]?.trim() || null : null,
    })
  }
  return items
}

async function importProductsAndPrices(opts: {
  items: ImportItem[]
  request: NextRequest
  source: string
}): Promise<{
  created: number
  updated: number
  categoriesCreated: number
}> {
  const { items, request } = opts

  const categories = await prisma.category.findMany()
  const categoryByTitle = new Map(categories.map((c) => [c.title.toLowerCase(), c]))
  const categoryBySlug = new Map(categories.map((c) => [c.slug.toLowerCase(), c]))

  const codes = items.map((i) => (i.code ?? "").trim()).filter((c) => Boolean(c))
  const distinctCodes = Array.from(new Set(codes))

  const existingByCode = new Map<
    string,
    {
      id: string
      image: string
      images: string | null
      unitQuantity: number
      unitMeasure: string
      costPrice: number
      sku: string
      barcode: string | null
    }
  >()
  if (distinctCodes.length) {
    const existing = await prisma.product.findMany({
      where: { code: { in: distinctCodes } },
      select: {
        id: true,
        code: true,
        image: true,
        images: true,
        unitQuantity: true,
        unitMeasure: true,
        costPrice: true,
        sku: true,
        barcode: true,
      },
    })
    for (const p of existing) {
      if (p.code)
        existingByCode.set(p.code, {
          id: p.id,
          image: p.image,
          images: p.images,
          unitQuantity: p.unitQuantity,
          unitMeasure: p.unitMeasure,
          costPrice: p.costPrice,
          sku: p.sku,
          barcode: p.barcode,
        })
    }
  }

  let created = 0
  let updated = 0
  let categoriesCreated = 0

  for (const raw of items) {
    const name = String(raw.name ?? "").trim()
    if (!name) continue

    const description = String(raw.description ?? "").trim()
    const code = raw.code ? String(raw.code).trim() || null : null
    const catStr = String(raw.category ?? "").trim()
    const priceRaw = raw.price
    const priceNum = priceRaw == null ? NaN : parseFloatPT(String(priceRaw))

    const parseNum = (v: unknown) => {
      if (v == null || (typeof v === "string" && v.trim() === "")) return null
      const n = typeof v === "number" ? v : parseFloatPT(String(v))
      return Number.isNaN(n) ? null : n
    }

    let categoryId: string | null = null
    if (catStr) {
      const cat =
        categoryByTitle.get(catStr.toLowerCase()) ?? categoryBySlug.get(slugify(catStr).toLowerCase())
      if (cat) {
        categoryId = cat.id
      } else {
        const slug = slugify(catStr)
        if (!slug) continue
        // slug único: se já existir por corrida, reconsulta.
        try {
          const createdCat = await prisma.category.create({
            data: { slug, title: catStr },
          })
          categoriesCreated++
          categoryId = createdCat.id
          categoryByTitle.set(createdCat.title.toLowerCase(), createdCat)
          categoryBySlug.set(createdCat.slug.toLowerCase(), createdCat)
        } catch {
          const existing = await prisma.category.findUnique({ where: { slug } })
          if (existing) categoryId = existing.id
        }
      }
    }

    if (!categoryId) {
      // Fallback: usa a primeira categoria existente.
      if (categories.length) categoryId = categories[0].id
      if (!categoryId) continue
    }

    const existing = code ? existingByCode.get(code) : null
    const nextImage = raw.image?.trim() || undefined

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name,
          description,
          categoryId,
          unitQuantity: parseNum(raw.unitQuantity) ?? existing.unitQuantity,
          unitMeasure: raw.unitMeasure?.trim() || existing.unitMeasure,
          costPrice: parseNum(raw.costPrice) ?? existing.costPrice,
          sku: raw.sku?.trim() || existing.sku,
          barcode: raw.barcode?.trim() || existing.barcode,
          ...(nextImage ? { image: nextImage } : {}),
        },
      })

      if (!Number.isNaN(priceNum) && priceNum >= 0) {
        const current = await prisma.price.findFirst({
          where: { productId: existing.id },
          orderBy: { effectiveAt: "desc" },
          select: { value: true },
        })
        const oldVal = current?.value
        await prisma.price.create({
          data: {
            productId: existing.id,
            value: priceNum,
            oldValue: oldVal != null && oldVal !== priceNum ? oldVal : undefined,
          },
        })
      }

      updated++
    } else {
      const product = await prisma.product.create({
        data: {
          code,
          name,
          description,
          image: raw.image?.trim() || "/images/placeholder.jpg",
          categoryId,
          images: null,
          unitQuantity: parseNum(raw.unitQuantity) ?? 1,
          unitMeasure: raw.unitMeasure?.trim() || "un",
          costPrice: parseNum(raw.costPrice) ?? 0,
          sku: raw.sku?.trim() || `AUTO-${Date.now()}-${created}`,
          barcode: raw.barcode?.trim() || null,
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

  // Não cria log aqui: o handler principal registra tudo de uma vez.
  void request
  void opts

  return { created, updated, categoriesCreated }
}

async function applyUploadedImages(opts: {
  imageFiles: File[]
}): Promise<{ matched: number; uploaded: number }> {
  const { imageFiles } = opts

  const groups = new Map<string, File[]>()
  for (const f of imageFiles) {
    const code = fileBaseName(f.name)
    if (!code) continue
    const list = groups.get(code) ?? []
    list.push(f)
    groups.set(code, list)
  }

  const codes = Array.from(groups.keys())
  if (!codes.length) return { matched: 0, uploaded: 0 }

  const existingProducts = await prisma.product.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true },
  })
  const productByCode = new Map<string, { id: string }>()
  for (const p of existingProducts) {
    if (p.code) productByCode.set(p.code, { id: p.id })
  }

  let matched = 0
  let uploaded = 0
  for (const [code, files] of groups.entries()) {
    const product = productByCode.get(code)
    if (!product) continue

    const urls: string[] = []
    for (const f of files) {
      const url = await uploadFile(f)
      urls.push(url)
      uploaded++
    }

    const main = urls[0]
    await prisma.product.update({
      where: { id: product.id },
      data: {
        image: main,
        images: JSON.stringify(urls),
      },
    })

    matched++
  }

  return { matched, uploaded }
}

async function importCatalogConfig(opts: { config: CatalogConfig }): Promise<{
  banners: number
  homeKeys: number
  homeSections: number
  menuItems: number
  settings: boolean
}> {
  const { config } = opts

  let banners = 0
  let homeKeys = 0
  let menuItems = 0
  let homeSections = 0
  let settings = false

  if (Array.isArray(config.banners)) {
    await prisma.banner.deleteMany()
    await prisma.$transaction(
      config.banners.map((b) =>
        prisma.banner.create({
          data: {
            title: String(b.title ?? "").trim(),
            imageUrl: String(b.imageUrl ?? "").trim(),
            linkUrl: String(b.linkUrl ?? "").trim(),
            sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : Number(b.sortOrder ?? 0) || 0,
          },
        }),
      ),
    )
    banners = config.banners.length
  }

  if (config.home && typeof config.home === "object") {
    const entries = Object.entries(config.home)
    if (entries.length) {
      await prisma.$transaction(
        entries.map(([key, value]) =>
          prisma.homeContent.upsert({
            where: { key },
            create: { key, value: String(value ?? "") },
            update: { value: String(value ?? "") },
          }),
        ),
      )
      homeKeys = entries.length
    }
  }

  if (Array.isArray(config.homeSections)) {
    await prisma.homeSection.deleteMany()
    if (config.homeSections.length) {
      await prisma.$transaction(
        config.homeSections.map((s, idx) =>
          prisma.homeSection.create({
            data: {
              key: String(s.key ?? `section_${idx + 1}`).trim(),
              type: String(s.type ?? "text").trim(),
              value: String(s.value ?? ""),
              sortOrder: Number.isFinite(s.sortOrder) ? Number(s.sortOrder) : idx,
            },
          })
        )
      )
      homeSections = config.homeSections.length
    }
  }

  if (config.menu?.items && Array.isArray(config.menu.items)) {
    await prisma.menuItem.deleteMany()
    await prisma.$transaction(
      config.menu.items.map((i) =>
        prisma.menuItem.create({
          data: {
            label: String(i.label ?? "").trim() || "Item",
            slugOrUrl: String(i.slugOrUrl ?? "").trim() || "/",
            position: String(i.position ?? "header"),
            order: Number.isFinite(i.order) ? (i.order as number) : Number(i.order ?? 0) || 0,
            visible: typeof i.visible === "boolean" ? i.visible : true,
            targetType: String(i.targetType ?? "url"),
            categoryId: i.categoryId ?? null,
          },
        }),
      ),
    )
    menuItems = config.menu.items.length
  }

  if (config.settings && typeof config.settings === "object") {
    const existing = await prisma.siteSettings.findFirst({ select: { id: true } })
    const s = config.settings

    const data: Record<string, unknown> = {}
    const mapField = (key: string, target: string) => {
      if (s[key] != null) data[target] = String(s[key as keyof typeof s]).trim()
    }

    mapField("siteName", "siteName")
    mapField("siteTagline", "siteTagline")
    mapField("primaryColor", "primaryColor")
    mapField("secondaryColor", "secondaryColor")
    mapField("accentColor", "accentColor")
    mapField("whatsappColor", "whatsappColor")
    mapField("saleColor", "saleColor")
    mapField("whatsappNumber", "whatsappNumber")
    mapField("phoneDisplay", "phoneDisplay")
    mapField("city", "city")
    mapField("addressLine", "addressLine")
    mapField("hoursWeekdays", "hoursWeekdays")
    mapField("hoursSaturday", "hoursSaturday")
    mapField("hoursSunday", "hoursSunday")
    mapField("facebookUrl", "facebookUrl")
    mapField("instagramUrl", "instagramUrl")
    mapField("tiktokUrl", "tiktokUrl")
    mapField("youtubeUrl", "youtubeUrl")
    mapField("linkedinUrl", "linkedinUrl")
    mapField("xUrl", "xUrl")
    mapField("customSocials", "customSocials")
    mapField("logoUrl", "logoUrl")
    mapField("faviconUrl", "faviconUrl")
    mapField("heroWhatsappText", "heroWhatsappText")
    mapField("fabWhatsappText", "fabWhatsappText")
    mapField("ctaPrimaryText", "ctaPrimaryText")
    mapField("ctaSecondaryText", "ctaSecondaryText")
    mapField("ctaSecondaryUrl", "ctaSecondaryUrl")
    mapField("seoTitle", "seoTitle")
    mapField("seoDescription", "seoDescription")
    mapField("seoOgImageUrl", "seoOgImageUrl")
    mapField("seoBaseUrl", "seoBaseUrl")
    mapField("themePreset", "themePreset")

    if (existing) {
      await prisma.siteSettings.update({ where: { id: existing.id }, data: data as any })
    } else {
      await prisma.siteSettings.create({ data: data as any })
    }
    settings = true
  }

  return { banners, homeKeys, homeSections, menuItems, settings }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const formData = await request.formData()
    const source = (formData.get("source") ?? "csv").toString().toLowerCase()

    const csvFile = formData.get("file") as File | null
    const itemsText = formData.get("items") as string | null

    const imageFiles = formData.getAll("images").filter((v) => {
      return v && typeof (v as any).arrayBuffer === "function"
    }) as File[]
    const configFile = formData.get("config") as File | null

    let items: ImportItem[] = []
    if (csvFile) {
      const text = await csvFile.text()
      items = parseCSVToItems(text)
    } else if (itemsText) {
      const parsed = JSON.parse(itemsText || "[]")
      items = Array.isArray(parsed) ? parsed : parsed.items
    }

    if (!items?.length) {
      return NextResponse.json({ error: "Nenhum produto para importar (CSV ou items)" }, { status: 400 })
    }

    const productsOut = await importProductsAndPrices({
      items,
      request,
      source,
    })

    const imagesOut =
      imageFiles.length > 0 ? await applyUploadedImages({ imageFiles }) : { matched: 0, uploaded: 0 }

    let configOut: Awaited<ReturnType<typeof importCatalogConfig>> | null = null
    if (configFile) {
      const raw = await configFile.text()
      const parsed = JSON.parse(raw || "{}") as CatalogConfig
      configOut = await importCatalogConfig({ config: parsed })
    }

    await createAdminLog({
      adminId: admin.id,
      action: `catalog.import_${source}`,
      details: {
        source,
        products: productsOut,
        images: imagesOut,
        config: configOut ? { ...configOut } : null,
      },
      request,
    })

    return NextResponse.json({
      ok: true,
      products: productsOut,
      categories: { created: productsOut.categoriesCreated },
      images: imagesOut,
      config: configOut
        ? {
            imported: true,
            banners: configOut.banners,
            home: configOut.homeKeys,
            homeSections: configOut.homeSections,
            menu: configOut.menuItems,
            settings: configOut.settings,
          }
        : null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao importar catálogo" }, { status: 500 })
  }
}

