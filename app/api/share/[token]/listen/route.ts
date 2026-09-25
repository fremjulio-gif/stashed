import { NextRequest, NextResponse } from "next/server";
import { recordShareListen } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    await recordShareListen(token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording listen:", error);
    return NextResponse.json(
      { error: "Erreur enregistrement écoute" },
      { status: 500 }
    );
  }
}
