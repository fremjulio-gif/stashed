import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const COOKIE_NAME = "stashed_session";

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(COOKIE_NAME)?.value;

    // Protect dashboard routes
    if (pathname.startsWith("/dashboard")) {
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // If already logged in, redirect /login to /dashboard
    if (pathname === "/login") {
      if (token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/login",
  ],
};
