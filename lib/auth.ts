import { cookies } from "next/headers";

export const VISITOR_COOKIE_NAME = "stashed_user";
export const COOKIE_NAME = VISITOR_COOKIE_NAME;

export interface VisitorSession {
  pseudo: string;
  visitorId: string;
}

/**
 * Normalizes pseudo: trims whitespace, max 30 chars
 */
export function sanitizePseudo(pseudo: string): string {
  const clean = pseudo.trim().slice(0, 30);
  return clean || "Anonyme";
}

/**
 * Generate a unique lightweight visitor id
 */
export function generateVisitorId(): string {
  return `v_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Get current visitor session from cookies
 */
export async function getSession(): Promise<VisitorSession | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
    if (!raw) return null;

    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed && typeof parsed.pseudo === "string" && parsed.pseudo.trim().length > 0) {
        return {
          pseudo: sanitizePseudo(parsed.pseudo),
          visitorId: parsed.visitorId || generateVisitorId(),
        };
      }
    } catch {
      if (raw.trim().length > 0) {
        return {
          pseudo: sanitizePseudo(decodeURIComponent(raw)),
          visitorId: generateVisitorId(),
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Trust-based permission check:
 * Returns true if the session created this resource (by visitorId or pseudo match)
 */
export function canEditResource(
  resourceCreatorId: string | null | undefined,
  resourceCreatorName: string | null | undefined,
  session: VisitorSession | null
): boolean {
  if (!session || !session.pseudo) return false;
  if (resourceCreatorId && session.visitorId && resourceCreatorId === session.visitorId) {
    return true;
  }
  if (
    resourceCreatorName &&
    resourceCreatorName.trim().toLowerCase() === session.pseudo.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}
