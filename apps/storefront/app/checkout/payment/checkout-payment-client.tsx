"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { selectPayment } from "@/lib/actions/checkout";
import { isRedirectError } from "@/lib/utils/redirect-error";
import type { PaymentMethod } from "@/lib/validations/checkout";

interface CheckoutPaymentClientProps {
  checkoutSessionId: string;
  paymentMethods: PaymentMethod[];
}

export function CheckoutPaymentClient({
  checkoutSessionId,
  paymentMethods,
}: CheckoutPaymentClientProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    if (!checkoutSessionId || !selectedMethod) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("checkoutSessionId", checkoutSessionId);
        formData.append("paymentMethod", selectedMethod);

        await selectPayment(formData);
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
            : "Failed to select payment method",
        );
        router.push(`/checkout/error?message=${errorMessage}`);
      }
    });
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Select Payment Method</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No payment methods available
            </p>
            <Button
              onClick={() =>
                router.push(`/checkout/shipping?session=${checkoutSessionId}`)
              }
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter to only show available methods
  const availableMethods = paymentMethods.filter((m) => m.available);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Select Payment Method</h1>

      <div className="space-y-4">
        {availableMethods.map((method) => (
          <Card
            key={method.method}
            className={`cursor-pointer transition-colors ${
              selectedMethod === method.method ? "border-primary" : ""
            }`}
            onClick={() => setSelectedMethod(method.method)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{method.label}</h3>
                  {method.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {method.description}
                    </p>
                  )}
                  {method.fee > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Fee: ₹{(method.fee / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                {method.fee > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Fee</p>
                    <p className="text-lg font-semibold">
                      ₹{(method.fee / 100).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/checkout/shipping?session=${checkoutSessionId}`)
            }
            disabled={isPending}
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedMethod || isPending}
            className="flex-1"
          >
            {isPending ? "Saving..." : "Continue to Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}
