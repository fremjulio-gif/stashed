import { NextRequest, NextResponse } from "next/server";
import { getShareLinkByToken, recordShareView } from "@/lib/db";
import { jwtVerify } from "jose";

const DEFAULT_SECRET = "stashed_super_secure_daw_glass_jwt_key_2026";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || DEFAULT_SECRET
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const shareLink = await getShareLinkByToken(token);

    if (!shareLink || !shareLink.isActive) {
      return NextResponse.json(
        { error: "Ce lien de partage n'existe pas ou a été désactivé." },
        { status: 404 }
      );
    }

    // Check expiration
    if (shareLink.expiresAt) {
      const expirationDate = new Date(shareLink.expiresAt);
      if (expirationDate.getTime() < Date.now()) {
        return NextResponse.json(
          { error: "Ce lien de partage a expiré." },
          { status: 410 }
        );
      }
    }

    // Check if password protected
    if (shareLink.passwordHash) {
      const authCookie = req.cookies.get(`stashed_share_${token}`)?.value;
      let isAuthorized = false;

      if (authCookie) {
        try {
          const { payload } = await jwtVerify(authCookie, SECRET_KEY);
          if (payload.token === token) {
            isAuthorized = true;
          }
        } catch {
          isAuthorized = false;
        }
      }

      if (!isAuthorized) {
        // Return minimal public info without audio files
        const title =
          shareLink.project?.title || shareLink.track?.title || "Projet Protégé";
        const coverImageUrl = shareLink.project?.coverImageUrl || null;

        return NextResponse.json({
          requiresPassword: true,
          token: shareLink.token,
          title,
          coverImageUrl,
        });
      }
    }

    // Record view in background
    recordShareView(token).catch(console.error);

    return NextResponse.json({
      requiresPassword: false,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        allowDownload: shareLink.allowDownload,
        viewCount: shareLink.viewCount + 1,
        listenCount: shareLink.listenCount,
        expiresAt: shareLink.expiresAt,
        project: shareLink.project,
        track: shareLink.track,
      },
    });
  } catch (error) {
    console.error("Error fetching share link:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du lien" },
      { status: 500 }
    );
  }
}
