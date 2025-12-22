"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useVerifyPayment } from "@/hooks/use-payments";
import { getToken } from "@/lib/utils/storage";

interface PaymentGatewayClientProps {
  paymentIntentId: string;
  checkoutSessionId: string;
}

declare global {
  interface Window {
    Razorpay: Razorpay;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Razorpay {
  new (options: RazorpayOptions): RazorpayInstance;
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: string,
    handler: (response: { error?: { description?: string } }) => void,
  ) => void;
}

export function PaymentGatewayClient({
  paymentIntentId,
  checkoutSessionId,
}: PaymentGatewayClientProps) {
  const router = useRouter();
  const [_isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const razorpayLoaded = useRef(false);
  const verifyPaymentMutation = useVerifyPayment();

  const waitForOrderCreation = useCallback(async () => {
    // Poll for order creation (webhook may take a few seconds)
    const maxAttempts = 20; // 20 attempts = 20 seconds max
    const pollInterval = 1000; // 1 second

    const token = getToken();
    const ordersEndpoint = token ? "/store/orders" : "/store/orders"; // Guest users might not have orders endpoint

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Fetch orders list and look for order with matching razorpayOrderId
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${ordersEndpoint}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        if (response.ok) {
          const orders = await response.json();
          if (Array.isArray(orders)) {
            // Find order with matching razorpayOrderId
            const order = orders.find(
              (o: { razorpayOrderId?: string | null }) =>
                o.razorpayOrderId === paymentIntentId,
            );

            if (order?.id) {
              // Order found! Redirect to order page
              if (token) {
                router.push(`/orders/${order.id}`);
              } else {
                // For guest users, redirect to order confirmation page
                router.push(`/orders/${order.id}?guest=true`);
              }
              return;
            }
          }
        }

        // Order not found yet, wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error("Error polling for order:", error);
        // Continue polling even on error
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    // If we get here, order wasn't found after max attempts
    // Redirect to a generic success page or show a message
    router.push(
      `/checkout/success?session=${checkoutSessionId}&message=${encodeURIComponent("Order is being processed. You will receive a confirmation email shortly.")}`,
    );
  }, [paymentIntentId, checkoutSessionId, router]);

  useEffect(() => {
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!razorpayKeyId) {
      setError("Razorpay is not configured. Please contact support.");
      setIsLoading(false);
      return;
    }

    // Load Razorpay script
    const loadRazorpayScript = () => {
      if (razorpayLoaded.current) {
        initializeRazorpay();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        razorpayLoaded.current = true;
        initializeRazorpay();
      };
      script.onerror = () => {
        setError("Failed to load Razorpay payment gateway. Please try again.");
        setIsLoading(false);
      };
      document.body.appendChild(script);
    };

    const initializeRazorpay = () => {
      if (!window.Razorpay) {
        setError("Razorpay SDK not loaded. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      try {
        // Create Razorpay instance
        // Note: We use the paymentIntentId as order_id since backend already created the Razorpay order
        const razorpay = new window.Razorpay({
          key: razorpayKeyId,
          amount: 0, // Amount is already set in the Razorpay order, so we pass 0
          currency: "INR",
          name: "VestCodes Ecommerce",
          description: `Order Payment - Session ${checkoutSessionId.slice(0, 8)}`,
          order_id: paymentIntentId, // This is the Razorpay order ID created by backend
          handler: async (response: RazorpaySuccessResponse) => {
            setIsProcessing(true);
            try {
              // Verify payment with backend
              const verificationResult =
                await verifyPaymentMutation.mutateAsync({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

              if (!verificationResult.verified) {
                throw new Error(
                  verificationResult.message || "Payment verification failed",
                );
              }

              // Payment verified successfully
              // Backend webhook will create the order automatically
              // Poll for order creation or redirect
              await waitForOrderCreation();
            } catch (error) {
              console.error("Payment verification failed:", error);
              setError(
                error instanceof Error
                  ? error.message
                  : "Payment verification failed. Please contact support.",
              );
              setIsProcessing(false);
            }
          },
          prefill: {
            // We could fetch customer details from checkout session if needed
          },
          notes: {
            checkout_session_id: checkoutSessionId,
          },
          theme: {
            color: "#2563eb", // Blue theme
          },
          modal: {
            ondismiss: () => {
              // User closed the payment modal
              router.push(
                `/checkout/error?message=${encodeURIComponent("Payment was cancelled.")}`,
              );
            },
          },
        });

        // Handle payment failure
        razorpay.on(
          "payment.failed",
          (response: { error?: { description?: string } }) => {
            setError(
              response.error?.description ||
                "Payment failed. Please try again.",
            );
            setIsProcessing(false);
          },
        );

        // Open Razorpay checkout
        setIsLoading(false);
        razorpay.open();
      } catch (error) {
        console.error("Failed to initialize Razorpay:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to initialize payment gateway. Please try again.",
        );
        setIsLoading(false);
      }
    };

    loadRazorpayScript();

    // Cleanup: remove script on unmount if needed
    return () => {
      // Script cleanup is handled by browser
    };
  }, [
    paymentIntentId,
    checkoutSessionId,
    router,
    verifyPaymentMutation,
    waitForOrderCreation,
  ]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Payment Error</CardTitle>
            <CardDescription>
              An error occurred while processing your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-4">
              <Button
                onClick={() =>
                  router.push(`/checkout/payment?session=${checkoutSessionId}`)
                }
                variant="outline"
              >
                Try Again
              </Button>
              <Button onClick={() => router.push("/cart")} variant="outline">
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment and create your order...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Loading Payment Gateway</h2>
          <p className="text-muted-foreground">
            Please wait while we prepare your payment...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
