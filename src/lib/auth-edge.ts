import { SignJWT, jwtVerify } from "jose"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

const COOKIE_NAME = "goftaan-token"

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export { COOKIE_NAME }
