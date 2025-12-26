"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useOrder } from "../../../hooks/useOrders";
import { formatCurrency } from "../../../utils";

const OrderConfirmation: React.FC = () => {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;
  const searchParams = useSearchParams();
  const isGuest = searchParams?.get("guest") === "true";
  const { data: order, isLoading } = useOrder(orderId || "");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 mb-4">Order not found</p>
          <Link
            href="/shop"
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors inline-block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-icons text-4xl text-green-600">
              check_circle
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
          <p className="text-sm text-gray-500">Order ID: {order.id}</p>
        </div>

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

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/shop"
            className="flex-1 bg-white border border-black text-black px-8 py-4 rounded-none font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
