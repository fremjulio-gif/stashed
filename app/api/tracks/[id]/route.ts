import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTrackById, updateTrack, deleteTrack } from "@/lib/db";
import { deleteStoredFile } from "@/lib/storage";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateTrack(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Piste introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating track:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la piste" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const track = await getTrackById(id);
    if (!track) {
      return NextResponse.json(
        { error: "Piste introuvable" },
        { status: 404 }
      );
    }

    if (track.audioUrl) {
      await deleteStoredFile(track.storageKey || track.audioUrl);
    }

    await deleteTrack(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting track:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la piste" },
      { status: 500 }
    );
  }
}
