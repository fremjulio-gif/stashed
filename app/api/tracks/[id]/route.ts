import { NextRequest, NextResponse } from "next/server";
import { getSession, canEditResource } from "@/lib/auth";
import { getTrackById, updateTrack, deleteTrack, getProjectById } from "@/lib/db";
import { deleteStoredFile } from "@/lib/storage";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.pseudo) {
      return NextResponse.json(
        { error: "Veuillez choisir un pseudo pour modifier cette piste." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const track = await getTrackById(id);
    if (!track) {
      return NextResponse.json(
        { error: "Piste introuvable" },
        { status: 404 }
      );
    }

    const project = track.projectId ? await getProjectById(track.projectId) : null;
    const isAllowed =
      canEditResource(track.creatorId, track.creatorName, session) ||
      (project && canEditResource(project.creatorId, project.creatorName, session));

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: `Cette piste a été ajoutée par "${track.creatorName}". Vous ne pouvez modifier que vos propres pistes.`,
        },
        { status: 403 }
      );
    }

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
    if (!session || !session.pseudo) {
      return NextResponse.json(
        { error: "Veuillez choisir un pseudo pour supprimer cette piste." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const track = await getTrackById(id);
    if (!track) {
      return NextResponse.json(
        { error: "Piste introuvable" },
        { status: 404 }
      );
    }

    const project = track.projectId ? await getProjectById(track.projectId) : null;
    const isAllowed =
      canEditResource(track.creatorId, track.creatorName, session) ||
      (project && canEditResource(project.creatorId, project.creatorName, session));

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: `Cette piste a été ajoutée par "${track.creatorName}". Vous ne pouvez supprimer que vos propres pistes.`,
        },
        { status: 403 }
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
