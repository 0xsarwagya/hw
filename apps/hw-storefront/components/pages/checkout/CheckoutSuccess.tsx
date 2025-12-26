"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { SEO } from "../../../components/SEO";
import { useOrder } from "../../../hooks/useOrders";
import { formatCurrency } from "../../../utils";

const CheckoutSuccess: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get("orderId");
  const message = searchParams?.get("message");
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);

  // Try to fetch order if orderId is provided (but don't block UI)
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(orderId || "", {
    enabled: !!orderId,
    retry: 2, // Reduced retries to fail faster
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Auto-redirect to order confirmation if orderId is available and order is loaded
  useEffect(() => {
    if (orderId && order) {
      setShowRedirectMessage(true);
      // Redirect to order confirmation page after a delay
      const timer = setTimeout(() => {
        const token = localStorage.getItem("token");
        if (token) {
          router.push(`/account/orders/${orderId}`);
        } else {
          router.push(`/orders/${orderId}`);
        }
      }, 3000); // Increased delay to 3 seconds so user can see success message
      return () => clearTimeout(timer);
    }
  }, [orderId, order, router]);

  return (
    <>
      <SEO
        title="Order Successful"
        description="Your order has been placed successfully"
      />
      <div className="bg-white min-h-screen pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-4xl text-green-600">
                check_circle
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
            {message && <p className="text-sm text-gray-500 mt-2">{message}</p>}
            {orderId && (
              <p className="text-sm text-gray-500 mt-2">Order ID: {orderId}</p>
            )}
          </div>

          {order && (
            <div className="border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider mb-4">
                Order Details
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Status:</span>
                  <span className="font-bold">{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                {/* TODO: Fetch shipping address using order.shippingAddressId */}
                {order.shippingAddressId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 mb-2">Shipping Address ID:</p>
                    <p className="text-sm">{order.shippingAddressId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              className="flex-1 bg-white border border-black text-black px-8 py-4 rounded-none font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors text-center"
            >
              Continue Shopping
            </Link>
          </div>

          {orderLoading && orderId && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Loading order details...</p>
            </div>
          )}

          {orderError && orderId && (
            <div className="mt-6 text-center">
              <p className="text-sm text-yellow-600">
                Order details are being processed. Your order has been placed
                successfully.
              </p>
            </div>
          )}

          {showRedirectMessage && order && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Redirecting to order details...
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CheckoutSuccess;
