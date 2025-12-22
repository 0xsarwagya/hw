import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getPaymentMethods } from "@/lib/actions/checkout-data";
import { isRedirectError } from "@/lib/utils/redirect-error";
import type { PaymentMethod } from "@/lib/validations/checkout";
import { CheckoutPaymentClient } from "./checkout-payment-client";

async function CheckoutPaymentForm({
  checkoutSessionId,
}: {
  checkoutSessionId: string;
}) {
  let paymentMethods: PaymentMethod[] = [];
  let errorMessage: string | null = null;

  try {
    paymentMethods = await getPaymentMethods({
      checkoutSessionId,
    });
  } catch (error) {
    // Re-throw redirect errors
    if (isRedirectError(error)) {
      throw error;
    }

    // Log the error for debugging
    console.error("Error fetching payment methods:", error);

    // Store error message to show in UI instead of redirecting
    errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load payment methods. The checkout session may have expired.";
    paymentMethods = []; // Set empty array so component can render error state
  }

  // If we have an error, show error UI instead of redirecting
  if (errorMessage) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">{errorMessage}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Session ID: {checkoutSessionId}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              The checkout session may have expired. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CheckoutPaymentClient
      checkoutSessionId={checkoutSessionId}
      paymentMethods={paymentMethods}
    />
  );
}

function CheckoutPaymentLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Select Payment Method</h1>
      <Card>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="flex gap-4 pt-4">
              <div className="h-10 bg-muted animate-pulse rounded flex-1" />
              <div className="h-10 bg-muted animate-pulse rounded flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function CheckoutPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }> | { session?: string };
}) {
  // Handle both Promise and direct object (Next.js 14 vs 15)
  const resolvedSearchParams =
    searchParams instanceof Promise ? await searchParams : searchParams;
  const checkoutSessionId = resolvedSearchParams.session;

  if (!checkoutSessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">Invalid checkout session</p>
            <p className="text-sm text-muted-foreground">
              No session ID found in URL. Please start checkout from your cart.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Suspense fallback={<CheckoutPaymentLoading />}>
      <CheckoutPaymentForm checkoutSessionId={checkoutSessionId} />
    </Suspense>
  );
}
