"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook for managing sidebar navigation state
 *
 * Persists collapsed/expanded state in localStorage.
 * Returns the current state and a function to toggle it.
 *
 * @returns Object with isCollapsed state and toggleCollapse function
 *
 * @example
 * ```tsx
 * const { isCollapsed, toggleCollapse } = useNavState();
 *
 * <Button onClick={() => toggleCollapse()}>Toggle Sidebar</Button>
 * ```
 */
export function useNavState() {
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    } else {
      setIsCollapsed(false); // Default to expanded
    }
  }, []);

  const toggleCollapse = useCallback((value?: boolean) => {
    setIsCollapsed((prev) => {
      const newValue = value !== undefined ? value : !prev;
      if (newValue !== null) {
        localStorage.setItem("sidebar-collapsed", String(newValue));
      }
      return newValue;
    });
  }, []);

  return {
    isCollapsed: isCollapsed ?? false,
    toggleCollapse,
  };
}
