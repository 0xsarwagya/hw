"use client";

import dynamicImport from "next/dynamic";

// Dynamically import CheckoutShipping to avoid SSR issues with React Query
const CheckoutShipping = dynamicImport(
  () => import("@/components/pages/checkout/CheckoutShipping"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function CheckoutShippingPage() {
  return <CheckoutShipping />;
}
