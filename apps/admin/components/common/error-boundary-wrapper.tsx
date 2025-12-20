"use client";

import { ErrorBoundary } from "./error-boundary";

/**
 * Client wrapper for ErrorBoundary
 * Allows ErrorBoundary to be used in server components
 */
export function ErrorBoundaryWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
