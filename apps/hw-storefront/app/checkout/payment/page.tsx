"use client";

import dynamicImport from "next/dynamic";

// Dynamically import CheckoutPayment to avoid SSR issues with React Query
const CheckoutPayment = dynamicImport(
  () => import("@/components/pages/checkout/CheckoutPayment"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function CheckoutPaymentPage() {
  return <CheckoutPayment />;
}
