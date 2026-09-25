import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VISITOR_COOKIE_NAME = "stashed_user";

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const userCookie = request.cookies.get(VISITOR_COOKIE_NAME)?.value;

    // If accessing old /login route -> redirect directly to collaborative home
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Protect dashboard routes: require a pseudo
    if (pathname.startsWith("/dashboard")) {
      let hasValidPseudo = false;
      if (userCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userCookie));
          if (
            parsed &&
            typeof parsed.pseudo === "string" &&
            parsed.pseudo.trim().length > 0
          ) {
            hasValidPseudo = true;
          }
        } catch {
          if (userCookie.trim().length > 0) {
            hasValidPseudo = true;
          }
        }
      }

      if (!hasValidPseudo) {
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard", "/login"],
};
