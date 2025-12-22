import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useVerifyPayment } from "../../hooks/usePayments";
import { getToken } from "../../lib/utils/storage";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const PaymentGateway: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get("paymentIntentId");
  const checkoutSessionId = searchParams.get("session");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const razorpayLoaded = useRef(false);
  const verifyPaymentMutation = useVerifyPayment();

  const waitForOrderCreation = useCallback(async () => {
    const maxAttempts = 20;
    const pollInterval = 1000;
    const token = getToken();
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${apiUrl}/store/orders`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const orders = await response.json();
          if (Array.isArray(orders)) {
            const order = orders.find(
              (o: { razorpayOrderId?: string | null }) =>
                o.razorpayOrderId === paymentIntentId,
            );

            if (order?.id) {
              if (token) {
                navigate(`/account/orders/${order.id}`);
              } else {
                navigate(`/orders/${order.id}?guest=true`);
              }
              return;
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error("Error polling for order:", error);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    navigate(
      `/checkout/success?session=${checkoutSessionId}&message=${encodeURIComponent(
        "Order is being processed. You will receive a confirmation email shortly.",
      )}`,
    );
  }, [paymentIntentId, checkoutSessionId, navigate]);

  useEffect(() => {
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKeyId) {
      setError("Razorpay is not configured. Please contact support.");
      setIsLoading(false);
      return;
    }

    if (!paymentIntentId || !checkoutSessionId) {
      setError("Invalid payment session");
      setIsLoading(false);
      return;
    }

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
        const razorpay = new window.Razorpay({
          key: razorpayKeyId,
          amount: 0,
          currency: "INR",
          name: "VestCodes Ecommerce",
          description: `Order Payment - Session ${checkoutSessionId.slice(0, 8)}`,
          order_id: paymentIntentId,
          handler: async (response: RazorpaySuccessResponse) => {
            setIsProcessing(true);
            try {
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

              // If orderId is in the verification response, redirect to success page
              if (verificationResult.payment?.orderId) {
                navigate(
                  `/checkout/success?orderId=${verificationResult.payment.orderId}`,
                );
                return;
              }

              // Otherwise, wait for order creation
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
          theme: {
            color: "#2563eb",
          },
          modal: {
            ondismiss: () => {
              navigate(
                `/checkout/error?message=${encodeURIComponent("Payment was cancelled.")}`,
              );
            },
          },
        });

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

        setIsLoading(false);
        razorpay.open();
      } catch (error) {
        console.error("Failed to initialize Razorpay:", error);
        setError("Failed to initialize payment gateway. Please try again.");
        setIsLoading(false);
      }
    };

    loadRazorpayScript();
  }, [
    paymentIntentId,
    checkoutSessionId,
    navigate,
    verifyPaymentMutation,
    waitForOrderCreation,
  ]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/checkout")}
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {isLoading && (
          <>
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading payment gateway...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;
