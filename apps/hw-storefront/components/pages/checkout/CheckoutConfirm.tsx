"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useCart } from "../../../hooks/useCart";
import {
  useConfirmCheckout,
  usePaymentMethods,
} from "../../../hooks/useCheckout";
import { getToken } from "../../../lib/utils/storage";
import { formatCurrency } from "../../../utils";

const CheckoutConfirm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSessionId = searchParams?.get("session");
  const feeParam = searchParams?.get("fee");
  const { data: cart, isLoading: cartLoading, error: cartError } = useCart();
  const confirmCheckout = useConfirmCheckout();

  // Get payment fee from URL params or fetch from payment methods
  const {
    data: paymentMethods,
    isLoading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethods({
    checkoutSessionId: checkoutSessionId || undefined,
  });

  // Get the selected payment method fee
  const paymentFee = useMemo(() => {
    // First try to get from URL params
    if (feeParam) {
      const fee = parseFloat(feeParam);
      if (!isNaN(fee)) return fee;
    }
    // Fallback: get from payment methods (first available one)
    if (paymentMethods && paymentMethods.length > 0) {
      const selectedMethod = paymentMethods.find((m) => m.available);
      return selectedMethod?.fee || 0;
    }
    return 0;
  }, [feeParam, paymentMethods]);

  const handleConfirm = async () => {
    if (!checkoutSessionId) return;

    try {
      const result = await confirmCheckout.mutateAsync({
        checkoutSessionId,
      });

      // Handle redirect based on response
      if (result.orderId) {
        // COD order - redirect to success page first, then to order confirmation
        router.push(`/checkout/success?orderId=${result.orderId}`);
      } else if (
        result.paymentIntentId &&
        !result.paymentIntentId.startsWith("cod-")
      ) {
        // Online payment - redirect to payment gateway
        router.push(
          `/checkout/payment-gateway?paymentIntentId=${result.paymentIntentId}&session=${checkoutSessionId}`,
        );
      } else {
        // Fallback - show success page
        router.push("/checkout/success?message=Order placed successfully");
      }
    } catch (error) {
      console.error("Failed to place order:", error);
      router.push(
        `/checkout/error?message=${encodeURIComponent(
          error instanceof Error ? error.message : "Failed to place order",
        )}`,
      );
    }
  };

  if (!checkoutSessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 mb-4">Invalid checkout session</p>
          <button
            onClick={() => router.push("/checkout")}
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
          >
            Start Checkout
          </button>
        </div>
      </div>
    );
  }

  if (cartLoading || paymentMethodsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 mb-4">
            Error loading cart:{" "}
            {cartError instanceof Error ? cartError.message : "Unknown error"}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/shop")}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentMethodsError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 mb-4">
            Error loading payment methods:{" "}
            {paymentMethodsError instanceof Error
              ? paymentMethodsError.message
              : "Unknown error"}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() =>
                router.push(`/checkout/payment?session=${checkoutSessionId}`)
              }
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors"
            >
              Back to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <button
            onClick={() => router.push("/shop")}
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Review Your Order
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-wider mb-4">
                Order Summary
              </h2>

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider">
                  Items
                </h3>
                {cart.items.map((item) => {
                  const variantOptions = [
                    item.selectedSize && `Size: ${item.selectedSize}`,
                    item.selectedColor && `Color: ${item.selectedColor}`,
                  ]
                    .filter(Boolean)
                    .join(" • ");
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm border-b border-gray-100 pb-4"
                    >
                      <div className="flex-1">
                        <p className="font-bold">
                          {item.quantity}x {item.name || "Product"}
                        </p>
                        {variantOptions && (
                          <p className="text-gray-500 text-xs">
                            {variantOptions}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-bold">
                    {formatCurrency(cart.subtotal)}
                  </span>
                </div>

                {cart.discountCode && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({cart.discountCode})</span>
                    <span className="font-bold">
                      -{formatCurrency(cart.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span>GST</span>
                  <span className="font-bold">
                    {formatCurrency(cart.gstAmount)}
                  </span>
                </div>

                {paymentFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Payment Fee</span>
                    <span className="font-bold">
                      {formatCurrency(paymentFee)}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(cart.total + paymentFee)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() =>
                    router.push(
                      `/checkout/payment?session=${checkoutSessionId}`,
                    )
                  }
                  disabled={confirmCheckout.isPending}
                  className="px-6 py-3 border border-gray-300 text-black font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirmCheckout.isPending}
                  className="flex-1 bg-primary text-white font-bold py-3 uppercase tracking-wider hover:bg-blue-800 transition-colors disabled:opacity-50 text-lg"
                >
                  {confirmCheckout.isPending
                    ? "Placing Order..."
                    : "Place Order"}
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                Order Summary
              </h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">Product</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-bold">
                    {formatCurrency(cart.subtotal)}
                  </span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>
                      Discount
                      {cart.discountCode ? ` (${cart.discountCode})` : ""}
                    </span>
                    <span className="font-bold">
                      -{formatCurrency(cart.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>GST</span>
                  <span className="font-bold">
                    {formatCurrency(cart.gstAmount)}
                  </span>
                </div>
                {paymentFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Payment Fee</span>
                    <span className="font-bold">
                      {formatCurrency(paymentFee)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(cart.total + paymentFee)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutConfirm;
