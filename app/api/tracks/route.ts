import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTracks, createTrack } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const tracks = await getTracks(projectId);
    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des pistes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectId,
      title,
      artist,
      audioUrl,
      storageKey,
      format,
      duration,
      sizeBytes,
      bpm,
      waveformData,
    } = body;

    if (!title || !audioUrl || !format) {
      return NextResponse.json(
        { error: "Paramètres title, audioUrl et format requis" },
        { status: 400 }
      );
    }

    const track = await createTrack({
      projectId: projectId || null,
      title,
      artist: artist || "jlowav",
      audioUrl,
      storageKey: storageKey || null,
      format,
      duration: duration || 0,
      sizeBytes: sizeBytes || 0,
      bpm: bpm || null,
      waveformData: waveformData || null,
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error("Error creating track:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la piste" },
      { status: 500 }
    );
  }
}
