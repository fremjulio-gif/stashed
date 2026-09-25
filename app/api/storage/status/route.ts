import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageInfo } from "@/lib/storage";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const info = getStorageInfo();
    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json(
      { isConfigured: false, provider: "none", error: "Erreur lecture stockage" },
      { status: 500 }
    );
  }
}
