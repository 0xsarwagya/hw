"use client";

import { useEffect } from "react";
import { getGuestSessionId } from "@/lib/utils/storage";

/**
 * Client component to sync localStorage session ID to cookies
 * This ensures Server Actions can access the same session ID
 */
export function SessionSync() {
  useEffect(() => {
    // Sync localStorage session ID to cookie on mount
    // This ensures server-side code can access the same session
    getGuestSessionId();
  }, []);

  return null;
}
