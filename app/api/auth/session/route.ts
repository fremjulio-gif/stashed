import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  sanitizePseudo,
  generateVisitorId,
  VISITOR_COOKIE_NAME,
} from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    authenticated: session !== null,
    session,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPseudo = body?.pseudo;

    if (!rawPseudo || typeof rawPseudo !== "string" || !rawPseudo.trim()) {
      return NextResponse.json(
        { error: "Veuillez renseigner un pseudo valide." },
        { status: 400 }
      );
    }

    const pseudo = sanitizePseudo(rawPseudo);
    // Check if there is an existing visitorId in cookie
    const currentSession = await getSession();
    const visitorId = currentSession?.visitorId || generateVisitorId();

    const response = NextResponse.json({
      success: true,
      session: {
        pseudo,
        visitorId,
      },
    });

    const cookieData = encodeURIComponent(
      JSON.stringify({ pseudo, visitorId })
    );

    response.cookies.set(VISITOR_COOKIE_NAME, cookieData, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false, // Accessible to client for fast hydration
    });

    return response;
  } catch (error) {
    console.error("Session set error:", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer le pseudo." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(VISITOR_COOKIE_NAME);
  return response;
}
