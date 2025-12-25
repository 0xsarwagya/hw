import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // Get admin access token from cookies and add as Authorization header
    // This ensures authentication works even if cookies aren't properly forwarded
    const accessToken = cookieStore.get("admin_access_token")?.value;
    const headers: HeadersInit = {
      Cookie: cookieHeader,
    };

    // Add Authorization header if token exists (JWT strategy supports both cookies and Bearer token)
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const formData = await request.formData();
    const url = `${API_URL}/admin/storage/upload`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `Request failed with status ${response.status}`,
      }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Storage upload proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
