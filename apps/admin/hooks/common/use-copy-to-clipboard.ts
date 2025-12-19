/**
 * Hook for copying text to clipboard
 */

import { useCallback } from "react";
import { toast } from "sonner";

export function useCopyToClipboard() {
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (_error) {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  return { copyToClipboard };
}
