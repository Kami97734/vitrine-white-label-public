import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET

if (!ADMIN_JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET não definido. Configure um segredo forte no ambiente.")
}

const JWT_SECRET = new TextEncoder().encode(ADMIN_JWT_SECRET)
const COOKIE_NAME = "admin_token"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

export { COOKIE_NAME, COOKIE_MAX_AGE }

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createAdminToken(adminId: string): Promise<string> {
  return new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyAdminToken(token: string): Promise<{ adminId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const sub = payload.sub
    if (!sub || typeof sub !== "string") return null
    return { adminId: sub }
  } catch {
    return null
  }
}

export function getAdminTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(";").map((c) => c.trim())
  for (const c of cookies) {
    if (c.startsWith(`${COOKIE_NAME}=`)) {
      return c.slice(COOKIE_NAME.length + 1).trim()
    }
  }
  return null
}
