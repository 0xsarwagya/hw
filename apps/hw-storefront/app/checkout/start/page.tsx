"use client";

import dynamicImport from "next/dynamic";

// Dynamically import CheckoutStart to avoid SSR issues with React Query
const CheckoutStart = dynamicImport(
  () => import("@/components/pages/checkout/CheckoutStart"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function CheckoutStartPage() {
  return <CheckoutStart />;
}
