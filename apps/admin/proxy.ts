import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { decodeJWT, isTokenExpired } from "./lib/jwt";

/**
 * Protected routes that require authentication
 */
const protectedRoutes = ["/dashboard", "/products"];

/**
 * Public routes that don't require authentication
 */
const publicRoutes = ["/login", "/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie (set by backend)
  const token = request.cookies.get("admin_access_token")?.value;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // If accessing a protected route without a valid token, redirect to login
  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token is not expired (basic check - full verification happens on backend)
    if (isTokenExpired(token)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("expired", "true");
      return NextResponse.redirect(loginUrl);
    }
  }

  // If accessing login page with valid token, redirect to dashboard
  if (
    isPublicRoute &&
    pathname === "/login" &&
    token &&
    !isTokenExpired(token)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
