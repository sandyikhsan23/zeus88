import { SignJWT, jwtVerify } from "jose";

// Edge-safe: dipakai oleh middleware (edge runtime) DAN lib/auth (node).
// Tidak mengimpor prisma / bcrypt.

export const SESSION_COOKIE = "zeus88_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET belum di-set");
  return new TextEncoder().encode(s);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
