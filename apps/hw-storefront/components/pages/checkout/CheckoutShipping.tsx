"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useCart } from "../../../hooks/useCart";
import {
  useSelectShipping,
  useShippingMethods,
} from "../../../hooks/useCheckout";
import { formatCurrency } from "../../../utils";

const CheckoutShipping: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSessionId = searchParams?.get("session");
  const { data: cart } = useCart();
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const selectShipping = useSelectShipping();

  const {
    data: shippingMethods,
    isLoading,
    error: shippingError,
  } = useShippingMethods({
    checkoutSessionId: checkoutSessionId || undefined,
  });

  useEffect(() => {
    if (shippingMethods && shippingMethods.length > 0 && !selectedMethodId) {
      // Auto-select first method or cheapest
      const cheapest = shippingMethods.reduce((prev, curr) =>
        curr.cost < prev.cost ? curr : prev,
      );
      setSelectedMethodId(cheapest.id);
    }
  }, [shippingMethods, selectedMethodId]);

  const handleContinue = async () => {
    if (!checkoutSessionId || !selectedMethodId) return;

    try {
      await selectShipping.mutateAsync({
        checkoutSessionId,
        shippingMethodId: selectedMethodId,
      });
      router.push(`/checkout/payment?session=${checkoutSessionId}`);
    } catch (error) {
      console.error("Failed to select shipping method:", error);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (shippingError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 mb-4">
            Error loading shipping methods:{" "}
            {shippingError instanceof Error
              ? shippingError.message
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
                router.push(`/checkout/address?session=${checkoutSessionId}`)
              }
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors"
            >
              Back to Address
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!shippingMethods || shippingMethods.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">
            No shipping methods available for this address
          </p>
          <button
            onClick={() =>
              router.push(`/checkout/address?session=${checkoutSessionId}`)
            }
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
          >
            Change Address
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
            Select Shipping Method
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {shippingMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethodId(method.id)}
                className={`border-2 p-6 cursor-pointer transition-all ${
                  selectedMethodId === method.id
                    ? "border-primary bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="radio"
                        checked={selectedMethodId === method.id}
                        onChange={() => setSelectedMethodId(method.id)}
                        className="w-5 h-5 text-primary"
                      />
                      <h3 className="font-bold text-lg">{method.name}</h3>
                    </div>
                    {method.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {method.description}
                      </p>
                    )}
                    {method.estimatedDays && (
                      <p className="text-sm text-gray-500">
                        Estimated delivery: {method.estimatedDays} days
                      </p>
                    )}
                    {method.codAvailable && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        COD Available
                      </span>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold">
                      {formatCurrency(method.cost / 100)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() =>
                  router.push(`/checkout/address?session=${checkoutSessionId}`)
                }
                disabled={selectShipping.isPending}
                className="px-6 py-3 border border-gray-300 text-black font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedMethodId || selectShipping.isPending}
                className="flex-1 bg-primary text-white font-bold py-3 uppercase tracking-wider hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {selectShipping.isPending ? "Saving..." : "Continue to Payment"}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                Order Summary
              </h2>
              {cart && (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.items.map((item) => {
                      const variantOptions = [
                        item.selectedSize && `Size: ${item.selectedSize}`,
                        item.selectedColor && `Color: ${item.selectedColor}`,
                      ]
                        .filter(Boolean)
                        .join(" • ");
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-100 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">
                              {item.name || "Product"}
                            </p>
                            {variantOptions && (
                              <p className="text-xs text-gray-500">
                                {variantOptions}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-bold">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
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
                    <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatCurrency(cart.total)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutShipping;
