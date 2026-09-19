import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL?.trim()
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD

if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  throw new Error("Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD antes de executar o seed.")
}

const categoriesData = [
  {
    slug: "embalagens",
    title: "Embalagens",
    products: [
      { name: "Copos Descartaveis 300ml", description: "Pacote c/ 100 unidades", image: "/images/copos-descartaveis.jpg", price: 14.9 },
      { name: "Pratos Descartaveis 15cm", description: "Pacote c/ 50 unidades", image: "/images/pratos-descartaveis.jpg", price: 11.9 },
      { name: "Marmitex Aluminio M", description: "Pacote c/ 50 unidades", image: "/images/marmitex.jpg", price: 29.9 },
      { name: "Bandejas de Isopor", description: "Pacote c/ 100 unidades", image: "/images/bandejas-isopor.jpg", price: 22.5 },
      { name: "Sacolas Plasticas P", description: "Pacote c/ 100 unidades", image: "/images/sacolas-plasticas.jpg", price: 15.9 },
      { name: "Sacolas Plasticas G", description: "Pacote c/ 100 unidades", image: "/images/sacolas-plasticas.jpg", price: 32.9 },
      { name: "Sacolas Kraft P", description: "Pacote c/ 50 unidades", image: "/images/sacolas-papel.jpg", price: 24.9 },
      { name: "Sacolas Kraft G", description: "Pacote c/ 50 unidades", image: "/images/sacolas-papel.jpg", price: 39.9 },
      { name: "Caixa Papelao P", description: "Unidade - 20x15x10cm", image: "/images/caixas-papelao.jpg", price: 3.5 },
      { name: "Caixa Papelao M", description: "Unidade - 40x30x20cm", image: "/images/caixas-papelao.jpg", price: 7.9 },
      { name: "Filme Stretch", description: "Rolo 500m", image: "/images/filme-stretch.jpg", price: 28.9 },
      { name: "Fita Adesiva Transparente", description: "Rolo 100m", image: "/images/fita-adesiva.jpg", price: 8.5 },
    ],
  },
  {
    slug: "sorveteria",
    title: "Sorveteria",
    products: [
      { name: "Potes de Sorvete 1L", description: "Pacote c/ 20 unidades", image: "/images/pote-sorvete.jpg", price: 18.9 },
      { name: "Colheres para Sorvete", description: "Pacote c/ 500 unidades", image: "/images/colheres-sorvete.jpg", price: 12.5 },
      { name: "Tacas Sundae 300ml", description: "Pacote c/ 50 unidades", image: "/images/tacas-sundae.jpg", price: 22.9 },
      { name: "Casquinhas / Cones", description: "Caixa c/ 300 unidades", image: "/images/casquinhas.jpg", price: 34.9 },
    ],
  },
  {
    slug: "papelaria",
    title: "Papelaria",
    products: [
      { name: "Cadernos Espiral 200 folhas", description: "Unidade", image: "/images/cadernos.jpg", price: 16.9 },
      { name: "Papel Sulfite A4 500 folhas", description: "Resma", image: "/images/papel-sulfite.jpg", price: 26.9 },
      { name: "Canetas Esferograficas", description: "Caixa c/ 50 unidades", image: "/images/canetas.jpg", price: 29.9 },
      { name: "EVA Colorido", description: "Pacote c/ 10 folhas", image: "/images/eva-colorido.jpg", price: 9.9 },
    ],
  },
  {
    slug: "festas",
    title: "Festas",
    products: [
      { name: "Pratos Decorados Festa", description: "Pacote c/ 8 unidades", image: "/images/pratos-festa.jpg", price: 12.9 },
      { name: "Baloes Coloridos", description: "Pacote c/ 50 unidades", image: "/images/baloes.jpg", price: 14.9 },
      { name: "Faixa Parabens", description: "Unidade", image: "/images/faixa-parabens.jpg", price: 8.9 },
      { name: "Copos Decorados Festa", description: "Pacote c/ 8 unidades", image: "/images/copos-festa.jpg", price: 10.9 },
    ],
  },
]

async function main() {
  const existing = await prisma.category.count()
  if (existing > 0) {
    console.log("Banco ja possui dados. Pule o seed ou apague as tabelas.")
    return
  }
  for (const cat of categoriesData) {
    const category = await prisma.category.create({
      data: { slug: cat.slug, title: cat.title },
    })
    for (const p of cat.products) {
      const product = await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          image: p.image,
          categoryId: category.id,
        },
      })
      await prisma.price.create({
        data: { productId: product.id, value: p.price },
      })
    }
  }
  const adminCount = await prisma.admin.count()
  if (adminCount === 0) {
    const hash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10)
    await prisma.admin.create({
      data: { email: SEED_ADMIN_EMAIL.toLowerCase(), passwordHash: hash },
    })
    console.log(
      `Admin criado: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD} (altere em producao nas configuracoes do painel).`
    )
  }
  const settingsCount = await prisma.siteSettings.count()
  if (settingsCount === 0) {
    await prisma.siteSettings.create({
      data: {
        siteName: "Demo Store",
        primaryColor: "#0c87b8",
        whatsappColor: "#22c55e",
        saleColor: "#f97316",
        whatsappNumber: "",
        phoneDisplay: "",
        city: "Sua cidade - UF",
      },
    })
    console.log("Configuracoes padrao criadas.")
  }
  console.log("Seed concluido.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
