/**
 * Utility to check if an error is a Next.js redirect error
 * Next.js redirect() throws a special error that should not be caught
 */

export function isRedirectError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Handle errors from server actions, re-throwing redirect errors
 * Use this in client components when calling server actions that may redirect
 */
export function handleServerActionError(error: unknown): never {
  // Re-throw redirect errors - Next.js needs these to perform navigation
  if (isRedirectError(error)) {
    throw error;
  }

  // For other errors, throw a regular error
  throw error instanceof Error
    ? error
    : new Error("An unexpected error occurred");
}
