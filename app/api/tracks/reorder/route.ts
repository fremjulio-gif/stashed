import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reorderTracks } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { projectId, trackIds } = await req.json();
    if (!Array.isArray(trackIds)) {
      return NextResponse.json(
        { error: "trackIds doit être un tableau d'identifiants" },
        { status: 400 }
      );
    }

    await reorderTracks(projectId || null, trackIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tracks:", error);
    return NextResponse.json(
      { error: "Erreur lors du réordonnancement des pistes" },
      { status: 500 }
    );
  }
}
