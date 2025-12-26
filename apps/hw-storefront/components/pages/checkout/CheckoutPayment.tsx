"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useCart } from "../../../hooks/useCart";
import {
  usePaymentMethods,
  useSelectPayment,
} from "../../../hooks/useCheckout";
import { formatCurrency } from "../../../utils";

const CheckoutPayment: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSessionId = searchParams?.get("session");
  const { data: cart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const selectPayment = useSelectPayment();

  const {
    data: paymentMethods,
    isLoading,
    error: paymentError,
  } = usePaymentMethods({
    checkoutSessionId: checkoutSessionId || undefined,
  });

  const handleContinue = async () => {
    if (!checkoutSessionId || !selectedMethod) return;

    try {
      const result = await selectPayment.mutateAsync({
        checkoutSessionId,
        paymentMethod: selectedMethod,
      });
      // Pass payment fee via URL params
      const feeParam = result.fee ? `&fee=${result.fee}` : "";
      router.push(`/checkout/confirm?session=${checkoutSessionId}${feeParam}`);
    } catch (error) {
      console.error("Failed to select payment method:", error);
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

  if (paymentError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 mb-4">
            Error loading payment methods:{" "}
            {paymentError instanceof Error
              ? paymentError.message
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
                router.push(`/checkout/shipping?session=${checkoutSessionId}`)
              }
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors"
            >
              Back to Shipping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableMethods = paymentMethods?.filter((m) => m.available) || [];
  const unavailableMethods = paymentMethods?.filter((m) => !m.available) || [];

  if (availableMethods.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">No payment methods available</p>
          {unavailableMethods.length > 0 && (
            <div className="mb-4 text-left">
              {unavailableMethods.map((method) => (
                <p key={method.method} className="text-sm text-red-600 mb-2">
                  {method.label}: {method.unavailableReason || "Not available"}
                </p>
              ))}
            </div>
          )}
          <button
            onClick={() =>
              router.push(`/checkout/shipping?session=${checkoutSessionId}`)
            }
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
          >
            Go Back
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
            Select Payment Method
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {availableMethods.map((method) => (
              <div
                key={method.method}
                onClick={() => setSelectedMethod(method.method)}
                className={`border-2 p-6 cursor-pointer transition-all ${
                  selectedMethod === method.method
                    ? "border-primary bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="radio"
                        checked={selectedMethod === method.method}
                        onChange={() => setSelectedMethod(method.method)}
                        className="w-5 h-5 text-primary"
                      />
                      <h3 className="font-bold text-lg">{method.label}</h3>
                    </div>
                    {method.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {method.description}
                      </p>
                    )}
                    {method.fee > 0 && (
                      <p className="text-sm text-gray-500">
                        Processing fee: {formatCurrency(method.fee)}
                      </p>
                    )}
                  </div>
                  {method.fee > 0 && (
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500">Fee</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(method.fee)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show unavailable methods with reasons */}
            {unavailableMethods.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  Unavailable Payment Methods
                </h3>
                {unavailableMethods.map((method) => (
                  <div
                    key={method.method}
                    className="border-2 border-gray-200 bg-gray-50 p-4 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="radio"
                            disabled
                            className="w-5 h-5 text-gray-400"
                          />
                          <h3 className="font-bold text-lg text-gray-600">
                            {method.label}
                          </h3>
                        </div>
                        {method.unavailableReason && (
                          <p className="text-sm text-red-600 mt-1">
                            {method.unavailableReason}
                          </p>
                        )}
                        {method.fee > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Fee: {formatCurrency(method.fee)}
                          </p>
                        )}
                      </div>
                      {method.fee > 0 && (
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-400">Fee</p>
                          <p className="text-lg font-bold text-gray-400">
                            {formatCurrency(method.fee)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() =>
                  router.push(`/checkout/shipping?session=${checkoutSessionId}`)
                }
                disabled={selectPayment.isPending}
                className="px-6 py-3 border border-gray-300 text-black font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedMethod || selectPayment.isPending}
                className="flex-1 bg-primary text-white font-bold py-3 uppercase tracking-wider hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {selectPayment.isPending ? "Saving..." : "Continue to Review"}
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
                    {selectedMethod &&
                      paymentMethods &&
                      (() => {
                        const selectedPaymentMethod = paymentMethods.find(
                          (m) => m.method === selectedMethod,
                        );
                        const paymentFee = selectedPaymentMethod?.fee || 0;
                        return paymentFee > 0 ? (
                          <div className="flex justify-between text-sm">
                            <span>Payment Fee</span>
                            <span className="font-bold">
                              {formatCurrency(paymentFee)}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatCurrency(
                          cart.total +
                            (selectedMethod && paymentMethods
                              ? paymentMethods.find(
                                  (m) => m.method === selectedMethod,
                                )?.fee || 0
                              : 0),
                        )}
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

export default CheckoutPayment;
