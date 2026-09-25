import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjects, createProject } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
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
    const { title, description, coverImageUrl, accentColor, isDownloadable } =
      body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Le titre du projet est obligatoire." },
        { status: 400 }
      );
    }

    const project = await createProject({
      title: title.trim(),
      description: description?.trim() || null,
      coverImageUrl: coverImageUrl || null,
      accentColor: accentColor || "#00ffd5",
      isDownloadable: isDownloadable ?? true,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du projet" },
      { status: 500 }
    );
  }
}
