import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const OWNER_EMAIL = "frem.julio@gmail.com";
export const OWNER_NAME = "jlowav";
export const COOKIE_NAME = "stashed_session";

const DEFAULT_SECRET = "stashed_super_secure_daw_glass_jwt_key_2026";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || DEFAULT_SECRET
);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "owner";
}

/**
 * Validates the owner passcode or password against environment variable or default
 */
export function verifyPasscode(passcode: string): boolean {
  const expectedPasscode =
    process.env.OWNER_PASSPHRASE || process.env.ADMIN_PASSWORD || "stashed2026";
  return passcode.trim() === expectedPasscode.trim();
}

/**
 * Creates a signed JWT for the owner session
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT token
 */
export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated owner from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Middleware check helper
 */
export async function checkAuthFromRequest(
  req: NextRequest
): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await verifyToken(token);
  return session !== null;
}
