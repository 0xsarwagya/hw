"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Hook to detect network offline/online status
 *
 * @example
 * ```tsx
 * const { isOnline, wasOffline } = useOfflineDetection();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */
export function useOfflineDetection(options?: {
  showToast?: boolean;
  onOnline?: () => void;
  onOffline?: () => void;
}) {
  const { showToast = true, onOnline, onOffline } = options || {};
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline && showToast) {
        toast.success("Connection restored");
      }
      setWasOffline(false);
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      if (showToast) {
        toast.error("You are offline. Some features may not work.");
      }
      onOffline?.();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline, showToast, onOnline, onOffline]);

  return {
    isOnline,
    wasOffline,
  };
}

/**
 * Hook to retry failed API calls with exponential backoff
 */
export function useRetryLogic<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    onRetry?: (attempt: number) => void;
  },
) {
  const { maxRetries = 3, initialDelay = 1000, onRetry } = options || {};

  const retry = async (attempt = 0): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }

      const delay = initialDelay * 2 ** attempt;
      onRetry?.(attempt + 1);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(attempt + 1);
    }
  };

  return { retry };
}
