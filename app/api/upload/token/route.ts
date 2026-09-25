import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDirectUploadUrl } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { filename, contentType, folder } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Paramètres filename et contentType requis" },
        { status: 400 }
      );
    }

    const uploadInfo = await getDirectUploadUrl(
      filename,
      contentType,
      folder || "audio"
    );

    return NextResponse.json(uploadInfo);
  } catch (error) {
    console.error("Token error:", error);
    return NextResponse.json(
      { error: "Impossible de générer le jeton de téléversement." },
      { status: 500 }
    );
  }
}
