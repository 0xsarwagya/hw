import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes - don't check auth for these
  if (
    pathname === "/login" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for admin access token in cookies
  const accessToken = request.cookies.get("admin_access_token");
  const refreshToken = request.cookies.get("admin_refresh_token");

  // If no tokens, redirect to login (but avoid redirect loop)
  if (!accessToken && !refreshToken) {
    // Don't redirect if already going to login
    if (pathname !== "/login") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add session info to headers for server components
  const response = NextResponse.next();
  if (accessToken) {
    response.headers.set("x-admin-session", "true");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

