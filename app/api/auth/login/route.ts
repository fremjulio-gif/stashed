import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  OWNER_EMAIL,
  OWNER_NAME,
  signSession,
  verifyPasscode,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode, email } = body;

    // Check if passcode is provided
    if (!passcode) {
      return NextResponse.json(
        { error: "Le mot de passe / code d'accès est requis." },
        { status: 400 }
      );
    }

    // Verify passcode against configured secret
    const isValid = verifyPasscode(passcode);
    if (!isValid) {
      return NextResponse.json(
        { error: "Code d'accès incorrect." },
        { status: 401 }
      );
    }

    // Sign session
    const token = await signSession({
      userId: "owner-jlowav-1",
      email: email || OWNER_EMAIL,
      name: OWNER_NAME,
      role: "owner",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        name: OWNER_NAME,
        email: OWNER_EMAIL,
        role: "owner",
      },
    });

    // Set cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion." },
      { status: 500 }
    );
  }
}
