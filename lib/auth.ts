import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
const hasGoogleConfig = Boolean(googleClientId && googleClientSecret)

// Um único usuário por conta Google (sem logins duplicados: email único no banco)
const providers = [] as NextAuthOptions["providers"]
if (hasGoogleConfig && googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60,   // atualiza a cada 24h
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account: _account }) {
      if (!user.email) return false
      // Um único login por e-mail: se já existe usuário com este e-mail, só permite se for o mesmo provider (evita duplicatas)
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true },
      })
      if (existing && _account) {
        const sameProvider = existing.accounts.some(
          (a) => a.provider === _account.provider && a.providerAccountId === _account.providerAccountId
        )
        if (!sameProvider) {
          // Mesmo e-mail com outro provider: bloquear para não criar conta duplicada
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string
        session.user.email = token.email ?? null
        session.user.name = token.name ?? null
        session.user.image = token.picture ?? null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  events: {
    async createUser() {
      // Usuário criado: email já é único no schema
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
