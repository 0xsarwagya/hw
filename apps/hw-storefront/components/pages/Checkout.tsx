"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../../components/LoadingSpinner";
import { SEO } from "../../components/SEO";
import {
  useApplyDiscount,
  useCart,
  useRemoveDiscount,
} from "../../hooks/useCart";
import {
  useApplyAddress,
  useConfirmCheckout,
  usePaymentMethods,
  useSelectPayment,
  useSelectShipping,
  useShippingMethods,
  useStartCheckout,
} from "../../hooks/useCheckout";
import {
  type CheckoutAddressInput,
  checkoutAddressInputSchema,
} from "../../lib/validations/checkout";
import { formatCurrency } from "../../utils";

type CheckoutStep = "start" | "address" | "shipping" | "payment" | "confirm";

const Checkout: React.FC = () => {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const startCheckout = useStartCheckout();
  const applyAddress = useApplyAddress();
  const selectShipping = useSelectShipping();
  const selectPayment = useSelectPayment();
  const confirmCheckout = useConfirmCheckout();

  const [step, setStep] = useState<CheckoutStep>("start");
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(
    null,
  );
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<
    string | null
  >(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [paymentFee, setPaymentFee] = useState<number>(0);
  const [isWaitingForDiscount, setIsWaitingForDiscount] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Discount hooks
  const applyDiscount = useApplyDiscount();
  const removeDiscount = useRemoveDiscount();

  // Address form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutAddressInput>({
    resolver: zodResolver(checkoutAddressInputSchema),
    defaultValues: {
      country: "India",
      createAccount: false,
    },
  });

  const createAccount = watch("createAccount");

  // Fetch shipping methods when address is applied
  const {
    data: shippingMethodsData,
    error: shippingMethodsError,
    isLoading: shippingMethodsLoading,
  } = useShippingMethods(checkoutSessionId ? { checkoutSessionId } : undefined);
  const shippingMethods = shippingMethodsData || [];

  // Fetch payment methods when shipping is selected
  const { data: paymentMethodsData } = usePaymentMethods(
    checkoutSessionId && step === "payment" ? { checkoutSessionId } : undefined,
  );
  const paymentMethods = paymentMethodsData || [];

  // Note: Shipping method is auto-selected by backend in applyAddress response
  // This effect is kept as fallback only if backend doesn't auto-select
  useEffect(() => {
    if (
      shippingMethods.length > 0 &&
      !selectedShippingMethodId &&
      step === "shipping"
    ) {
      // Fallback: select cheapest if backend didn't auto-select
      const cheapest = shippingMethods.reduce((prev, curr) =>
        curr.cost < prev.cost ? curr : prev,
      );
      setSelectedShippingMethodId(cheapest.id);
    }
  }, [shippingMethods, selectedShippingMethodId, step]);

  // Step 1: Start checkout with retry logic
  const hasAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (cartLoading) return;

    if (!cart || cart.items.length === 0) {
      router.push("/shop");
      return;
    }

    // Prevent multiple simultaneous checkout attempts
    if (hasAttemptedRef.current) {
      return;
    }

    if (step === "start" && !checkoutSessionId) {
      hasAttemptedRef.current = true;
      retryCountRef.current = 0;

      const attemptCheckout = async () => {
        console.log("🔄 Starting checkout for cart:", cart.id);
        try {
          const session = await startCheckout.mutateAsync({ cartId: cart.id });
          console.log("✅ Checkout started successfully:", session);
          // Clear any pending retry
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
          retryCountRef.current = 0;
          hasAttemptedRef.current = false; // Reset so we can retry if needed
          setCheckoutSessionId(session.checkoutSessionId);
          setStep("address");
        } catch (error) {
          console.error("Failed to start checkout:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to start checkout";

          // Handle rate limiting (429) - wait longer before retry
          if (
            (errorMessage.toLowerCase().includes("rate limit") ||
              errorMessage.toLowerCase().includes("429")) &&
            retryCountRef.current < MAX_RETRIES
          ) {
            const waitTime = 2000; // Wait 2 seconds for rate limit
            console.log(
              `Rate limited, waiting ${waitTime}ms before retry (${retryCountRef.current + 1}/${MAX_RETRIES})...`,
            );
            retryCountRef.current += 1;
            retryTimeoutRef.current = setTimeout(() => {
              attemptCheckout();
            }, waitTime);
            return;
          }

          // Handle cart lock conflict (409) - backend handles stale locks, but may need multiple attempts
          if (
            (errorMessage.toLowerCase().includes("lock") ||
              errorMessage.toLowerCase().includes("locked") ||
              errorMessage.toLowerCase().includes("conflict") ||
              errorMessage
                .toLowerCase()
                .includes("already being checked out")) &&
            retryCountRef.current < MAX_RETRIES
          ) {
            // Exponential backoff: 500ms, 1000ms, 1500ms
            const waitTime = 500 + retryCountRef.current * 500;
            console.log(
              `Cart locked, waiting ${waitTime}ms for backend to handle stale lock (${retryCountRef.current + 1}/${MAX_RETRIES})...`,
            );
            retryCountRef.current += 1;
            retryTimeoutRef.current = setTimeout(() => {
              attemptCheckout();
            }, waitTime);
            return;
          }

          // Other errors or max retries exceeded - show error page
          console.error(
            "Max retries exceeded or non-retryable error:",
            errorMessage,
          );
          router.push(
            "/checkout/error?message=" +
              encodeURIComponent(
                errorMessage || "Failed to start checkout. Please try again.",
              ),
          );
        }
      };

      // Initial checkout attempt
      attemptCheckout();

      // Cleanup on unmount
      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }
  }, [cart, cartLoading, step, checkoutSessionId, router, startCheckout]);

  // Step 2: Apply address
  const onAddressSubmit = async (data: CheckoutAddressInput) => {
    if (!checkoutSessionId) return;

    try {
      // Remove createAccount from the data - backend doesn't accept it
      // Only include password if createAccount is true and password is provided
      const { createAccount, password, ...addressData } = data;

      const response = await applyAddress.mutateAsync({
        checkoutSessionId,
        ...addressData,
        country: addressData.country || "India",
        // Only include password if user wants to create account and provided password
        ...(createAccount && password ? { password } : {}),
      });

      // Use backend's auto-selected shipping method if available
      if (response.autoSelectedShippingMethodId) {
        setSelectedShippingMethodId(response.autoSelectedShippingMethodId);
      }

      setStep("shipping");
    } catch (error) {
      console.error("Failed to save address:", error);
    }
  };

  // Step 3: Select shipping
  const handleSelectShipping = async () => {
    if (!checkoutSessionId || !selectedShippingMethodId) return;

    try {
      await selectShipping.mutateAsync({
        checkoutSessionId,
        shippingMethodId: selectedShippingMethodId,
      });

      // Wait 5 seconds for discount to be auto-selected/calculated by backend
      setIsWaitingForDiscount(true);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setIsWaitingForDiscount(false);

      setStep("payment");
    } catch (error) {
      console.error("Failed to select shipping:", error);
      setIsWaitingForDiscount(false);
    }
  };

  // Step 4: Select payment
  const handleSelectPayment = async () => {
    if (!checkoutSessionId || !selectedPaymentMethod) return;

    try {
      const result = await selectPayment.mutateAsync({
        checkoutSessionId,
        paymentMethod: selectedPaymentMethod,
      });
      // Store the payment fee from the response
      if (result.fee !== undefined) {
        setPaymentFee(result.fee);
      }
      setStep("confirm");
    } catch (error) {
      console.error("Failed to select payment:", error);
    }
  };

  // Step 5: Confirm checkout
  const handleConfirmOrder = async () => {
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

  // Show loading when cart is loading or checkout is being started
  if (
    cartLoading ||
    (step === "start" && (startCheckout.isPending || !checkoutSessionId))
  ) {
    // Show error if checkout failed
    if (startCheckout.isError && step === "start") {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <p className="text-red-600 mb-4">
              {startCheckout.error instanceof Error
                ? startCheckout.error.message
                : "Failed to start checkout"}
            </p>
            <button
              onClick={() => {
                hasAttemptedRef.current = false;
                setStep("start");
                setCheckoutSessionId(null);
              }}
              className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If we're past start step but don't have a session ID, something went wrong
  if (step !== "start" && !checkoutSessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 mb-4">
            Checkout session expired or invalid
          </p>
          <button
            onClick={() => {
              setStep("start");
              setCheckoutSessionId(null);
              hasAttemptedRef.current = false;
            }}
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
          >
            Restart Checkout
          </button>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Your cart is empty</p>
          <button
            onClick={() => router.push("/shop")}
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 w-full">
      <SEO
        title="Checkout - Complete Your Order"
        description="Complete your order and get your products delivered"
      />

      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {["address", "shipping", "payment", "confirm"].map((s, idx) => {
              const stepIndex = [
                "address",
                "shipping",
                "payment",
                "confirm",
              ].indexOf(step);
              const isActive = step === s;
              const isCompleted = stepIndex > idx;

              return (
                <React.Fragment key={s}>
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isActive
                          ? "bg-primary text-white"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden sm:block capitalize">
                      {s === "address"
                        ? "Address"
                        : s === "shipping"
                          ? "Shipping"
                          : s === "payment"
                            ? "Payment"
                            : "Review"}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {step === "address" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>
                <form
                  onSubmit={handleSubmit(onAddressSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">
                      Full Name *
                    </label>
                    <input
                      {...register("name")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={applyAddress.isPending}
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        {...register("email")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={applyAddress.isPending}
                      />
                      {errors.email && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        {...register("phone")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={applyAddress.isPending}
                      />
                      {errors.phone && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      {...register("address1")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={applyAddress.isPending}
                    />
                    {errors.address1 && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.address1.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">
                      Address Line 2 (optional)
                    </label>
                    <input
                      {...register("address2")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={applyAddress.isPending}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase mb-2">
                        City *
                      </label>
                      <input
                        {...register("city")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={applyAddress.isPending}
                      />
                      {errors.city && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase mb-2">
                        State *
                      </label>
                      <input
                        {...register("state")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={applyAddress.isPending}
                      />
                      {errors.state && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.state.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">
                      PIN Code *
                    </label>
                    <input
                      {...register("pincode")}
                      maxLength={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={applyAddress.isPending}
                    />
                    {errors.pincode && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.pincode.message}
                      </p>
                    )}
                  </div>

                  {/* Account Creation */}
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="createAccount"
                        checked={createAccount}
                        onChange={(e) =>
                          setValue("createAccount", e.target.checked)
                        }
                        className="mt-1"
                        disabled={applyAddress.isPending}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="createAccount"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Create an account for faster checkout
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Save your information for future orders
                        </p>
                      </div>
                    </div>

                    {createAccount && (
                      <div className="mt-4">
                        <label className="block text-xs font-bold uppercase mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          {...register("password")}
                          placeholder="Enter password (min. 8 characters)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled={applyAddress.isPending}
                        />
                        {errors.password && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.password.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => router.push("/shop")}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-bold uppercase hover:bg-gray-50"
                      disabled={applyAddress.isPending}
                    >
                      Back to Shop
                    </button>
                    <button
                      type="submit"
                      disabled={applyAddress.isPending}
                      className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-blue-800 disabled:opacity-50"
                    >
                      {applyAddress.isPending
                        ? "Saving..."
                        : "Continue to Shipping"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Shipping */}
            {step === "shipping" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">
                  Select Shipping Method
                </h2>

                {shippingMethodsLoading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner />
                    <p className="text-gray-600 mt-4">
                      Loading shipping methods...
                    </p>
                  </div>
                ) : shippingMethodsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">
                      {shippingMethodsError instanceof Error
                        ? shippingMethodsError.message
                        : "Failed to load shipping methods. Please try again."}
                    </p>
                    <button
                      onClick={() => {
                        // Retry by refetching
                        window.location.reload();
                      }}
                      className="px-6 py-3 bg-primary text-white rounded-lg font-bold uppercase hover:bg-blue-800"
                    >
                      Retry
                    </button>
                  </div>
                ) : shippingMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      No shipping methods available
                    </p>
                    <button
                      onClick={() => setStep("address")}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-bold uppercase hover:bg-gray-50"
                    >
                      Change Address
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {shippingMethods.map((method) => (
                        <div
                          key={method.id}
                          onClick={() => setSelectedShippingMethodId(method.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedShippingMethodId === method.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold">{method.name}</h3>
                              {method.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {method.description}
                                </p>
                              )}
                              {method.estimatedDays && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Estimated delivery: {method.estimatedDays}{" "}
                                  days
                                </p>
                              )}
                              {method.codAvailable && (
                                <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  COD Available
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">
                                {formatCurrency(method.cost / 100)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep("address")}
                        className="px-6 py-3 border border-gray-300 rounded-lg font-bold uppercase hover:bg-gray-50"
                        disabled={selectShipping.isPending}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSelectShipping}
                        disabled={
                          !selectedShippingMethodId ||
                          selectShipping.isPending ||
                          isWaitingForDiscount
                        }
                        className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-blue-800 disabled:opacity-50"
                      >
                        {isWaitingForDiscount
                          ? "Applying discount..."
                          : selectShipping.isPending
                            ? "Saving..."
                            : "Continue to Payment"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {step === "payment" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">
                  Select Payment Method
                </h2>

                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      No payment methods available
                    </p>
                    <button
                      onClick={() => setStep("shipping")}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-bold uppercase hover:bg-gray-50"
                    >
                      Go Back
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {paymentMethods
                        .filter((m) => m.available)
                        .map((method) => (
                          <div
                            key={method.method}
                            onClick={() =>
                              setSelectedPaymentMethod(method.method)
                            }
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedPaymentMethod === method.method
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-bold">{method.label}</h3>
                                {method.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {method.description}
                                  </p>
                                )}
                                {method.fee > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Fee: {formatCurrency(method.fee)}
                                  </p>
                                )}
                              </div>
                              {method.fee > 0 && (
                                <div className="text-right">
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
                      {paymentMethods.filter((m) => !m.available).length >
                        0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                            Unavailable Payment Methods
                          </h3>
                          {paymentMethods
                            .filter((m) => !m.available)
                            .map((method) => (
                              <div
                                key={method.method}
                                className="p-4 border-2 border-gray-200 bg-gray-50 rounded-lg opacity-75"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-bold text-gray-600">
                                      {method.label}
                                    </h3>
                                    {method.unavailableReason && (
                                      <p className="text-sm text-red-600 mt-1">
                                        {method.unavailableReason}
                                      </p>
                                    )}
                                    {method.fee > 0 && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Fee: {formatCurrency(method.fee)}
                                      </p>
                                    )}
                                  </div>
                                  {method.fee > 0 && (
                                    <div className="text-right">
                                      <p className="text-sm text-gray-400">
                                        Fee
                                      </p>
                                      <p className="text-lg font-semibold text-gray-400">
                                        {formatCurrency(method.fee)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep("shipping")}
                        className="px-6 py-3 border border-gray-300 rounded-lg font-bold uppercase hover:bg-gray-50"
                        disabled={selectPayment.isPending}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSelectPayment}
                        disabled={
                          !selectedPaymentMethod || selectPayment.isPending
                        }
                        className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-blue-800 disabled:opacity-50"
                      >
                        {selectPayment.isPending
                          ? "Saving..."
                          : "Continue to Review"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === "confirm" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-bold mb-2">Items</h3>
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
                          className="flex justify-between text-sm py-2 border-b"
                        >
                          <span>
                            {item.quantity}x {item.name || "Product"}
                            {variantOptions && (
                              <span className="text-gray-500 text-xs block mt-1">
                                {variantOptions}
                              </span>
                            )}
                          </span>
                          <span>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cart.subtotal)}</span>
                    </div>

                    {cart.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>
                          Discount
                          {cart.discountCode ? ` (${cart.discountCode})` : ""}
                        </span>
                        <span>-{formatCurrency(cart.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>GST</span>
                      <span>{formatCurrency(cart.gstAmount)}</span>
                    </div>

                    {paymentFee > 0 && (
                      <div className="flex justify-between">
                        <span>Payment Fee</span>
                        <span>{formatCurrency(paymentFee)}</span>
                      </div>
                    )}

                    <div className="border-t pt-4 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(cart.total + paymentFee)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep("payment")}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-bold uppercase hover:bg-gray-50"
                    disabled={confirmCheckout.isPending}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={confirmCheckout.isPending}
                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-blue-800 disabled:opacity-50"
                  >
                    {confirmCheckout.isPending
                      ? "Placing Order..."
                      : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>

              <div className="space-y-2 mb-4">
                {cart.items.map((item) => {
                  const variantOptions = [
                    item.selectedSize && `Size: ${item.selectedSize}`,
                    item.selectedColor && `Color: ${item.selectedColor}`,
                  ]
                    .filter(Boolean)
                    .join(" • ");
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name || "Item"}
                        {variantOptions && (
                          <span className="text-gray-500 text-xs block">
                            {variantOptions}
                          </span>
                        )}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Discount Code Input */}
              <div className="border-t pt-4 mb-4">
                <label className="block text-xs font-bold uppercase mb-2">
                  Discount Code
                </label>
                {cart.discountCode ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">
                        {cart.discountCode}
                      </span>
                      <span className="text-green-600 text-sm">
                        (-{formatCurrency(cart.discountAmount)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountError(null);
                        removeDiscount.mutate();
                      }}
                      disabled={removeDiscount.isPending}
                      className="text-gray-500 hover:text-red-600 transition-colors"
                      aria-label="Remove discount"
                    >
                      {removeDiscount.isPending ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!discountCode.trim()) return;
                      setDiscountError(null);
                      applyDiscount.mutate(discountCode.trim(), {
                        onSuccess: () => {
                          setDiscountCode("");
                        },
                        onError: (error) => {
                          setDiscountError(
                            error instanceof Error
                              ? error.message
                              : "Failed to apply discount",
                          );
                        },
                      });
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value.toUpperCase());
                        setDiscountError(null);
                      }}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={applyDiscount.isPending}
                    />
                    <button
                      type="submit"
                      disabled={!discountCode.trim() || applyDiscount.isPending}
                      className="px-4 py-2 bg-primary text-white text-sm font-bold uppercase rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {applyDiscount.isPending ? "..." : "Apply"}
                    </button>
                  </form>
                )}
                {discountError && (
                  <p className="text-red-600 text-xs mt-2">{discountError}</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>

                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>
                      Discount
                      {cart.discountCode ? ` (${cart.discountCode})` : ""}
                    </span>
                    <span>-{formatCurrency(cart.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>GST</span>
                  <span>{formatCurrency(cart.gstAmount)}</span>
                </div>

                {paymentFee > 0 && (
                  <div className="flex justify-between">
                    <span>Payment Fee</span>
                    <span>{formatCurrency(paymentFee)}</span>
                  </div>
                )}

                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(cart.total + paymentFee)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
