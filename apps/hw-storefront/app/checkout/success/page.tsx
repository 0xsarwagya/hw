"use client";

import dynamicImport from "next/dynamic";

// Dynamically import CheckoutSuccess to avoid SSR issues with React Query
const CheckoutSuccess = dynamicImport(
  () => import("@/components/pages/checkout/CheckoutSuccess"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function CheckoutSuccessPage() {
  return <CheckoutSuccess />;
}
