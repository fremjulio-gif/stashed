import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createShareLink } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, trackId, password, expiresAt, allowDownload } = body;

    if (!projectId && !trackId) {
      return NextResponse.json(
        { error: "Un projectId ou un trackId est requis pour créer un lien" },
        { status: 400 }
      );
    }

    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    let parsedExpiresAt: Date | null = null;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
    }

    const shareLink = await createShareLink({
      projectId: projectId || null,
      trackId: trackId || null,
      passwordHash,
      expiresAt: parsedExpiresAt,
      allowDownload: allowDownload ?? true,
    });

    return NextResponse.json(shareLink, { status: 201 });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du lien de partage" },
      { status: 500 }
    );
  }
}
