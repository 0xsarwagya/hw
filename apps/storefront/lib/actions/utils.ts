/**
 * Server Actions utilities
 * Handles cookies, session management, and API calls from server-side
 */

import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Get or create guest session ID from cookies
 */
export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("session-id")?.value;

  if (!sessionId) {
    // Generate new session ID
    sessionId = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    cookieStore.set("session-id", sessionId, {
      httpOnly: false, // Allow client-side access for localStorage sync
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
  }

  return sessionId;
}

/**
 * Get auth token from cookies
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value || null;
}

/**
 * Make API call from server action
 * Automatically includes cookies and session ID
 */
export async function serverApiClient<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const cookieStore = await cookies();
  const sessionId = await getSessionId();
  const token = await getAuthToken();

  // Build cookie header from all cookies
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Cookie: cookieHeader, // Forward all cookies to backend
    "X-Session-Id": sessionId, // Also send as header for backward compatibility
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include", // Include cookies in cross-origin requests
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use default error message
    }

    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Set session ID cookie (for when backend creates a new session)
 */
export async function setSessionId(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session-id", sessionId, {
    httpOnly: false, // Allow client-side access for localStorage sync
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}
