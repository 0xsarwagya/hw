"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { SEO } from "../../../components/SEO";

const CheckoutError: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message =
    searchParams?.get("message") ||
    "An error occurred during checkout. Please try again.";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        title="Checkout Error"
        description="An error occurred during checkout"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Checkout Error
          </h1>

          <p className="text-gray-600 mb-8">{decodeURIComponent(message)}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/checkout")}
              className="bg-primary text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/shop")}
              className="px-6 py-3 border border-gray-300 rounded-lg font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutError;
