"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
  enabled?: boolean;
}

/**
 * Hook to warn users about unsaved changes before navigating away
 *
 * @example
 * ```tsx
 * const [hasChanges, setHasChanges] = useState(false);
 * useUnsavedChanges({
 *   hasUnsavedChanges: hasChanges,
 *   message: "You have unsaved changes. Are you sure you want to leave?",
 * });
 * ```
 */
export function useUnsavedChanges({
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
  enabled = true,
}: UseUnsavedChangesOptions) {
  const _router = useRouter();
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Keep ref in sync
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const _handleRouteChange = (_url: string) => {
      if (hasUnsavedChangesRef.current) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          // Cancel navigation by throwing an error
          throw new Error("Navigation cancelled by user");
        }
      }
    };

    // Handle browser back/forward and page unload
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Note: Next.js doesn't provide a built-in way to intercept route changes
    // This would need to be handled at the page/component level
    // For now, we only handle beforeunload

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, message]);

  return {
    hasUnsavedChanges,
  };
}

/**
 * Hook to handle form unsaved changes with Next.js router
 * Use this in forms that need to prevent navigation
 */
export function useFormUnsavedChanges(
  hasUnsavedChanges: boolean,
  message?: string,
) {
  const router = useRouter();

  // Handle browser navigation
  useUnsavedChanges({ hasUnsavedChanges, message });

  // Return a function to check before programmatic navigation
  const checkBeforeNavigate = (href: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        message || "You have unsaved changes. Are you sure you want to leave?",
      );
      if (!confirmed) {
        return false;
      }
    }
    router.push(href);
    return true;
  };

  return { checkBeforeNavigate };
}
