import { NextRequest, NextResponse } from "next/server";
import {
  sanitizePseudo,
  generateVisitorId,
  VISITOR_COOKIE_NAME,
  getSession,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPseudo = body?.pseudo || body?.passcode || "Visiteur";
    const pseudo = sanitizePseudo(rawPseudo);

    const currentSession = await getSession();
    const visitorId = currentSession?.visitorId || generateVisitorId();

    const response = NextResponse.json({
      success: true,
      user: {
        name: pseudo,
        pseudo,
        visitorId,
      },
    });

    response.cookies.set(
      VISITOR_COOKIE_NAME,
      encodeURIComponent(JSON.stringify({ pseudo, visitorId })),
      {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false,
      }
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
