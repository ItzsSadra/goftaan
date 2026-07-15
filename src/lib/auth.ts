import { hash, compare } from "bcryptjs"
export { createToken, verifyToken, COOKIE_NAME } from "./auth-edge"

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return compare(password, passwordHash)
}
