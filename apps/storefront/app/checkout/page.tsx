import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getCart } from "@/lib/actions/cart";
import { serverApiClient } from "@/lib/actions/utils";
import { isRedirectError } from "@/lib/utils/redirect-error";
import { checkoutSessionSchema } from "@/lib/validations/checkout";

export default async function CheckoutStartPage() {
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Add some products to your cart before checkout
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Start checkout directly in Server Component (don't use server action with redirect)
  try {
    const data = await serverApiClient<unknown>("/store/checkout/start", {
      method: "POST",
      body: {
        cartId: cart.id,
      },
    });

    const session = checkoutSessionSchema.parse(data);

    // Redirect to address page - this will throw NEXT_REDIRECT error (expected)
    redirect(`/checkout/address?session=${session.checkoutSessionId}`);
  } catch (error) {
    // Re-throw redirect errors - Next.js needs these to perform navigation
    if (isRedirectError(error)) {
      throw error;
    }

    // Only handle actual errors, not redirects
    const errorMessage = encodeURIComponent(
      error instanceof Error ? error.message : "Failed to start checkout",
    );
    redirect(`/checkout/error?message=${errorMessage}`);
  }

  // Fallback loading state (shouldn't reach here)
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Starting checkout...</h1>
          <p className="text-muted-foreground">
            Please wait while we prepare your order
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
