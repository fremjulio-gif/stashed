import { NextRequest, NextResponse } from "next/server";
import { getShareLinkByToken } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const DEFAULT_SECRET = "stashed_super_secure_daw_glass_jwt_key_2026";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || DEFAULT_SECRET
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { password } = body;

    const shareLink = await getShareLinkByToken(token);
    if (!shareLink || !shareLink.isActive) {
      return NextResponse.json(
        { error: "Ce lien de partage n'existe pas." },
        { status: 404 }
      );
    }

    if (!shareLink.passwordHash) {
      return NextResponse.json({ success: true });
    }

    if (!password) {
      return NextResponse.json(
        { error: "Mot de passe requis" },
        { status: 400 }
      );
    }

    const matches = await bcrypt.compare(password, shareLink.passwordHash);
    if (!matches) {
      return NextResponse.json(
        { error: "Mot de passe incorrect." },
        { status: 401 }
      );
    }

    // Generate authorized JWT for this share link
    const shareCookieToken = await new SignJWT({ token, authorized: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(SECRET_KEY);

    const response = NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        allowDownload: shareLink.allowDownload,
        viewCount: shareLink.viewCount,
        listenCount: shareLink.listenCount,
        expiresAt: shareLink.expiresAt,
        project: shareLink.project,
        track: shareLink.track,
      },
    });

    response.cookies.set(`stashed_share_${token}`, shareCookieToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du mot de passe." },
      { status: 500 }
    );
  }
}
