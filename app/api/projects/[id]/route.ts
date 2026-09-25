import { NextRequest, NextResponse } from "next/server";
import { getSession, canEditResource } from "@/lib/auth";
import { getProjectById, updateProject, deleteProject, getTracks } from "@/lib/db";
import { deleteStoredFile } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du projet" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.pseudo) {
      return NextResponse.json(
        { error: "Veuillez choisir un pseudo pour modifier ce projet." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 404 }
      );
    }

    // Permission check
    if (!canEditResource(project.creatorId, project.creatorName, session)) {
      return NextResponse.json(
        {
          error: `Ce projet appartient à "${project.creatorName}". Vous ne pouvez modifier que vos propres créations.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await updateProject(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet" },
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
        { error: "Veuillez choisir un pseudo pour supprimer ce projet." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 404 }
      );
    }

    // Permission check
    if (!canEditResource(project.creatorId, project.creatorName, session)) {
      return NextResponse.json(
        {
          error: `Ce projet appartient à "${project.creatorName}". Vous ne pouvez supprimer que vos propres créations.`,
        },
        { status: 403 }
      );
    }

    // Delete associated track files from storage
    const tracks = await getTracks(id);
    for (const track of tracks) {
      if (track.audioUrl) {
        await deleteStoredFile(track.storageKey || track.audioUrl);
      }
    }

    // Delete cover image if stored
    if (project.coverImageUrl) {
      await deleteStoredFile(project.coverImageUrl);
    }

    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du projet" },
      { status: 500 }
    );
  }
}
