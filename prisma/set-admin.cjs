const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim()
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error("Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD antes de executar o script.")
  }

  const normalizedEmail = email.trim().toLowerCase()
  const hash = await bcrypt.hash(password, 10)

  const existing = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
  })

  if (existing) {
    await prisma.admin.update({
      where: { id: existing.id },
      data: { passwordHash: hash },
    })
    console.log(`[set-admin] Senha atualizada para ${normalizedEmail}.`)
  } else {
    await prisma.admin.create({
      data: { email: normalizedEmail, passwordHash: hash },
    })
    console.log(`[set-admin] Admin criado: ${normalizedEmail}.`)
  }

  console.log("[set-admin] Concluído.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

