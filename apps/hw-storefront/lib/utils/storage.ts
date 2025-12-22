/**
 * LocalStorage utilities for auth tokens and guest session
 */

const TOKEN_KEY = "user-token";
const GUEST_SESSION_KEY = "guest-session-id";

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set JWT token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Generate or get guest session ID
 */
export function getGuestSessionId(): string {
  if (typeof window === "undefined") {
    // Server-side: generate a temporary ID (won't persist)
    return `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  let sessionId = localStorage.getItem(GUEST_SESSION_KEY);

  if (!sessionId) {
    // Generate new session ID
    sessionId = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  }

  // Sync to cookie for consistency
  const cookies = document.cookie.split("; ");
  const sessionCookie = cookies.find((cookie) =>
    cookie.startsWith("session-id="),
  );
  if (!sessionCookie || sessionCookie.split("=")[1] !== sessionId) {
    // Set cookie with same value as localStorage
    const isProduction = import.meta.env.PROD;
    document.cookie = `session-id=${sessionId}; path=/; max-age=${
      30 * 24 * 60 * 60
    }; ${isProduction ? "secure; " : ""}samesite=lax`;
  }

  return sessionId;
}

/**
 * Clear guest session ID
 */
export function clearGuestSessionId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_SESSION_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}
