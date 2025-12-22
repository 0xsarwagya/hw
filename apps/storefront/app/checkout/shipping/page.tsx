import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getShippingMethods } from "@/lib/actions/checkout-data";
import { CheckoutShippingClient } from "./checkout-shipping-client";

async function CheckoutShippingForm({
  checkoutSessionId,
}: {
  checkoutSessionId: string;
}) {
  const shippingMethods = await getShippingMethods({
    checkoutSessionId,
  });

  return (
    <CheckoutShippingClient
      checkoutSessionId={checkoutSessionId}
      shippingMethods={shippingMethods}
    />
  );
}

function CheckoutShippingLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Select Shipping Method</h1>
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

export default async function CheckoutShippingPage({
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Suspense fallback={<CheckoutShippingLoading />}>
      <CheckoutShippingForm checkoutSessionId={checkoutSessionId} />
    </Suspense>
  );
}
