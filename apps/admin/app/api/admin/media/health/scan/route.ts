import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/media/health/scan`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: _request.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || "Failed to scan media health" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error scanning media health:", error);
    return NextResponse.json(
      { error: "Failed to scan media health" },
      { status: 500 },
    );
  }
}
