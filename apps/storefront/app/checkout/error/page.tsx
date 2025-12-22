"use client";

import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CheckoutErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorMessage =
    searchParams.get("message") ||
    "Your checkout session has expired or failed. Please start a new checkout.";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">Checkout Failed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">
              Don't worry, your cart items are still saved. You can try checkout
              again or continue shopping.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/cart")}
              className="flex-1"
            >
              View Cart
            </Button>
            <Button onClick={() => router.push("/checkout")} className="flex-1">
              Try Checkout Again
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              If this problem persists, please contact our support team for
              assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckoutErrorLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardContent className="p-8">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutErrorPage() {
  return (
    <Suspense fallback={<CheckoutErrorLoading />}>
      <CheckoutErrorContent />
    </Suspense>
  );
}
