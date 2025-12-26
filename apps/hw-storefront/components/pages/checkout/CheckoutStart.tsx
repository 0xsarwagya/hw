"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useCart } from "../../../hooks/useCart";
import { useStartCheckout } from "../../../hooks/useCheckout";

const CheckoutStart: React.FC = () => {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const startCheckout = useStartCheckout();
  const hasAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (cartLoading) return;

    if (!cart || cart.items.length === 0) {
      router.push("/shop");
      return;
    }

    // Prevent multiple simultaneous checkout attempts
    if (hasAttemptedRef.current) {
      return;
    }

    hasAttemptedRef.current = true;

    const attemptCheckout = (isRetry = false) => {
      startCheckout.mutate(
        { cartId: cart.id },
        {
          onSuccess: (session) => {
            // Clear any pending retry
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
            router.push(
              `/checkout/address?session=${session.checkoutSessionId}`,
            );
          },
          onError: (error) => {
            console.error("Failed to start checkout:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to start checkout";

            // Handle rate limiting (429) - wait longer before retry
            if (
              errorMessage.toLowerCase().includes("rate limit") ||
              errorMessage.toLowerCase().includes("429")
            ) {
              const waitTime = 2000; // Wait 2 seconds for rate limit
              console.log(
                `Rate limited, waiting ${waitTime}ms before retry...`,
              );
              retryTimeoutRef.current = setTimeout(() => {
                hasAttemptedRef.current = false; // Allow retry
                attemptCheckout(true);
              }, waitTime);
              return;
            }

            // Handle cart lock conflict (409) - backend handles stale locks, but may need a moment
            if (
              (errorMessage.toLowerCase().includes("lock") ||
                errorMessage.toLowerCase().includes("locked") ||
                errorMessage.toLowerCase().includes("conflict") ||
                errorMessage
                  .toLowerCase()
                  .includes("already being checked out")) &&
              !isRetry
            ) {
              const waitTime = 1000; // Wait 1 second for lock to clear
              console.log(
                "Cart locked, waiting for backend to handle stale lock...",
              );
              retryTimeoutRef.current = setTimeout(() => {
                hasAttemptedRef.current = false; // Allow retry
                attemptCheckout(true);
              }, waitTime);
              return;
            }

            // Other errors or retry failed - show error page
            router.push(
              "/checkout/error?message=" +
                encodeURIComponent(
                  errorMessage || "Failed to start checkout. Please try again.",
                ),
            );
          },
        },
      );
    };

    // Initial checkout attempt
    attemptCheckout();

    // Cleanup on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [cart, cartLoading, router, startCheckout]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

export default CheckoutStart;
