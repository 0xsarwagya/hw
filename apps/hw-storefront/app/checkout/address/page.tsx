"use client";

import dynamicImport from "next/dynamic";

// Dynamically import CheckoutAddress to avoid SSR issues with React Query
const CheckoutAddress = dynamicImport(
  () => import("@/components/pages/checkout/CheckoutAddress"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function CheckoutAddressPage() {
  return <CheckoutAddress />;
}
