"use client";

import dynamicImport from "next/dynamic";

// Dynamically import Checkout to avoid SSR issues with React Query
const Checkout = dynamicImport(() => import("@/components/pages/Checkout"), {
  ssr: false,
});

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <Checkout />;
}
