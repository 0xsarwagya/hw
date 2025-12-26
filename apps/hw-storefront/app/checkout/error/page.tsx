"use client";

import dynamicImport from "next/dynamic";

// Dynamically import CheckoutError to avoid SSR issues with React Query
const CheckoutError = dynamicImport(
  () => import("@/components/pages/checkout/CheckoutError"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function CheckoutErrorPage() {
  return <CheckoutError />;
}
