import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    // Get cookies from Next.js
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // Forward request to backend
    const response = await fetch(`${API_URL}/admin/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
      },
      credentials: "include",
    });

    // Create response
    const nextResponse = NextResponse.json(
      { message: "Logged out successfully" },
      { status: response.ok ? 200 : response.status }
    );

    // Clear cookies on frontend as well
    nextResponse.cookies.delete("admin_access_token");
    nextResponse.cookies.delete("admin_refresh_token");

    // Forward Set-Cookie headers from backend (in case backend sets empty cookies)
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookieString) => {
        const parts = cookieString.split(";").map((p) => p.trim());
        const [nameValue] = parts;
        const [name] = nameValue.split("=");
        
        // Delete the cookie
        nextResponse.cookies.delete(name);
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Logout proxy error:", error);
    // Even on error, clear cookies
    const nextResponse = NextResponse.json(
      { message: "Logged out" },
      { status: 200 }
    );
    nextResponse.cookies.delete("admin_access_token");
    nextResponse.cookies.delete("admin_refresh_token");
    return nextResponse;
  }
}

