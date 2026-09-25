import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadFileBuffer } from "@/lib/storage";

// Allow up to 250MB uploads
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "audio"; // "audio" | "cover"

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    const filename = file.name;
    const ext = filename.split(".").pop()?.toLowerCase();
    const size = file.size;

    // Validate Audio files
    if (type === "audio") {
      const allowedAudioExts = ["wav", "mp3"];
      if (!ext || !allowedAudioExts.includes(ext)) {
        return NextResponse.json(
          {
            error:
              "Format de fichier invalide. Seuls les fichiers .wav et .mp3 sont acceptés.",
          },
          { status: 400 }
        );
      }

      // Max size limit: 250MB
      const maxAudioSize = 250 * 1024 * 1024;
      if (size > maxAudioSize) {
        return NextResponse.json(
          {
            error: `Fichier trop volumineux (${(size / (1024 * 1024)).toFixed(1)} Mo). La limite est de 250 Mo.`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mime = ext === "wav" ? "audio/wav" : "audio/mpeg";

      const result = await uploadFileBuffer(buffer, filename, mime, "audio");

      return NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
        size: result.size,
        format: ext,
        filename,
      });
    }

    // Validate Cover images
    if (type === "cover") {
      const allowedCoverExts = ["jpg", "jpeg", "png", "webp", "avif"];
      if (!ext || !allowedCoverExts.includes(ext)) {
        return NextResponse.json(
          {
            error:
              "Format d'image invalide. Seuls JPG, PNG, WebP et AVIF sont acceptés.",
          },
          { status: 400 }
        );
      }

      const maxCoverSize = 10 * 1024 * 1024; // 10MB
      if (size > maxCoverSize) {
        return NextResponse.json(
          { error: "Image trop lourde. Limite max: 10 Mo." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mime = file.type || `image/${ext === "jpg" ? "jpeg" : ext}`;

      const result = await uploadFileBuffer(buffer, filename, mime, "covers");

      return NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
        size: result.size,
        format: ext,
        filename,
      });
    }

    return NextResponse.json(
      { error: "Type d'upload inconnu." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléversement du fichier." },
      { status: 500 }
    );
  }
}
