import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getSession();
        if (!session) {
          throw new Error("Non autorisé. Veuillez vous connecter au Dashboard.");
        }

        return {
          allowedContentTypes: [
            "audio/wav",
            "audio/x-wav",
            "audio/wave",
            "audio/mpeg",
            "audio/mp3",
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
          maximumSizeInBytes: 250 * 1024 * 1024, // 250MB per file
        };
      },
      onUploadCompleted: async () => {
        // Notification callback once upload finishes on Vercel Blob
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la préparation de l'upload.",
      },
      { status: 400 }
    );
  }
}
