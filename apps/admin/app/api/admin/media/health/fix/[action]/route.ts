import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { action } = await params;
    const searchParams = request.nextUrl.searchParams;
    const performedBy = searchParams.get("performedBy") || undefined;

    const url = new URL(`${BACKEND_URL}/admin/media/health/fix/${action}`);
    if (performedBy) {
      url.searchParams.append("performedBy", performedBy);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || "Failed to fix media issues" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fixing media issues:", error);
    return NextResponse.json(
      { error: "Failed to fix media issues" },
      { status: 500 },
    );
  }
}
