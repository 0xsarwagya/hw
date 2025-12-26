"use client";

import dynamicImport from "next/dynamic";

// Dynamically import CheckoutConfirm to avoid SSR issues with React Query
const CheckoutConfirm = dynamicImport(
  () => import("@/components/pages/checkout/CheckoutConfirm"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function CheckoutConfirmPage() {
  return <CheckoutConfirm />;
}
