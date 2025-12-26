"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useCart } from "../../../hooks/useCart";
import { useApplyAddress } from "../../../hooks/useCheckout";
import {
  type CheckoutAddressInput,
  checkoutAddressInputSchema,
} from "../../../lib/validations/checkout";
import { formatCurrency } from "../../../utils";

const CheckoutAddress: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSessionId = searchParams?.get("session");
  const { data: cart, isLoading: cartLoading, error: cartError } = useCart();
  const applyAddress = useApplyAddress();
  const [createAccount, setCreateAccount] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutAddressInput>({
    resolver: zodResolver(checkoutAddressInputSchema),
    defaultValues: {
      country: "India",
      createAccount: false,
    },
  });

  const watchedCreateAccount = watch("createAccount");

  const onSubmit = async (data: CheckoutAddressInput) => {
    if (!checkoutSessionId) {
      router.push("/checkout");
      return;
    }

    try {
      const result = await applyAddress.mutateAsync({
        checkoutSessionId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country || "India",
        password: createAccount && data.password ? data.password : undefined,
      });

      if (result.serviceability.isServiceable) {
        router.push(
          `/checkout/shipping?session=${result.checkoutSessionId || checkoutSessionId}`,
        );
      } else {
        alert(
          "We do not deliver to this address. Please try a different address.",
        );
      }
    } catch (error) {
      console.error("Failed to save address:", error);
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

  if (cartLoading) {
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Shipping Address
          </h1>
          <p className="text-gray-600">
            We'll use this address to calculate shipping and deliver your order
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Full Name *
                </label>
                <input
                  {...register("name")}
                  className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                  disabled={applyAddress.isPending}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                    Email *
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                    disabled={applyAddress.isPending}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                    Phone *
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                    disabled={applyAddress.isPending}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Address Line 1 *
                </label>
                <input
                  {...register("address1")}
                  className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                  disabled={applyAddress.isPending}
                />
                {errors.address1 && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.address1.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  Address Line 2 (optional)
                </label>
                <input
                  {...register("address2")}
                  className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                  disabled={applyAddress.isPending}
                />
                {errors.address2 && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.address2.message}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                    City *
                  </label>
                  <input
                    {...register("city")}
                    className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                    disabled={applyAddress.isPending}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                    State *
                  </label>
                  <input
                    {...register("state")}
                    className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                    disabled={applyAddress.isPending}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.state.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                  PIN Code *
                </label>
                <input
                  {...register("pincode")}
                  maxLength={10}
                  className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                  disabled={applyAddress.isPending}
                />
                {errors.pincode && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.pincode.message}
                  </p>
                )}
              </div>

              {/* Account Creation */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="createAccount"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    disabled={applyAddress.isPending}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="createAccount"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Create an account for faster checkout
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Save your information for future orders
                    </p>
                  </div>
                </div>

                {createAccount && (
                  <div className="mt-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
                      Password *
                    </label>
                    <input
                      {...register("password")}
                      type="password"
                      className="w-full border border-gray-300 p-3.5 rounded-none text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors bg-transparent"
                      placeholder="Enter password (min. 8 characters)"
                      disabled={applyAddress.isPending}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  disabled={applyAddress.isPending}
                  className="px-6 py-3 border border-gray-300 text-black font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={applyAddress.isPending}
                  className="flex-1 bg-primary text-white font-bold py-3 uppercase tracking-wider hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {applyAddress.isPending
                    ? "Saving..."
                    : "Continue to Shipping"}
                </button>
              </div>
            </form>
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
                          <div className="w-16 h-16 bg-gray-100 flex-shrink-0">
                            {/* Product image placeholder */}
                          </div>
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
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
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

export default CheckoutAddress;
