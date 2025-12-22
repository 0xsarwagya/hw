"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { selectShipping } from "@/lib/actions/checkout";
import { isRedirectError } from "@/lib/utils/redirect-error";
import type { ShippingMethod } from "@/lib/validations/checkout";

interface CheckoutShippingClientProps {
  checkoutSessionId: string;
  shippingMethods: ShippingMethod[];
}

export function CheckoutShippingClient({
  checkoutSessionId,
  shippingMethods,
}: CheckoutShippingClientProps) {
  const router = useRouter();
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    if (!checkoutSessionId || !selectedMethodId) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("checkoutSessionId", checkoutSessionId);
        formData.append("shippingMethodId", selectedMethodId);

        await selectShipping(formData);
        // Server action handles redirect via redirect() call
      } catch (error) {
        // Re-throw redirect errors - Next.js needs these to perform navigation
        if (isRedirectError(error)) {
          throw error;
        }

        // Only handle actual errors, not redirects
        const errorMessage = encodeURIComponent(
          error instanceof Error
            ? error.message
            : "Failed to select shipping method",
        );
        router.push(`/checkout/error?message=${errorMessage}`);
      }
    });
  };

  if (shippingMethods.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Select Shipping Method</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No shipping methods available for this address
            </p>
            <Button
              onClick={() =>
                router.push(`/checkout/address?session=${checkoutSessionId}`)
              }
            >
              Change Address
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Select Shipping Method</h1>

      <div className="space-y-4">
        {shippingMethods.map((method) => (
          <Card
            key={method.id}
            className={`cursor-pointer transition-colors ${
              selectedMethodId === method.id ? "border-primary" : ""
            }`}
            onClick={() => setSelectedMethodId(method.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{method.name}</h3>
                  {method.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {method.description}
                    </p>
                  )}
                  {method.estimatedDays && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Estimated delivery: {method.estimatedDays} days
                    </p>
                  )}
                  {method.codAvailable && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      COD Available
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">₹{method.cost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/checkout/address?session=${checkoutSessionId}`)
            }
            disabled={isPending}
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedMethodId || isPending}
            className="flex-1"
          >
            {isPending ? "Saving..." : "Continue to Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
