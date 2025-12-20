import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = new URL(`${BACKEND_URL}/admin/media/health/audit-logs`);

    // Forward query parameters
    const productId = searchParams.get("productId");
    if (productId) {
      url.searchParams.append("productId", productId);
    }
    const variantId = searchParams.get("variantId");
    if (variantId) {
      url.searchParams.append("variantId", variantId);
    }
    const imageId = searchParams.get("imageId");
    if (imageId) {
      url.searchParams.append("imageId", imageId);
    }
    const action = searchParams.get("action");
    if (action) {
      url.searchParams.append("action", action);
    }
    const limit = searchParams.get("limit");
    if (limit) {
      url.searchParams.append("limit", limit);
    }
    const offset = searchParams.get("offset");
    if (offset) {
      url.searchParams.append("offset", offset);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || "Failed to fetch audit logs" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
