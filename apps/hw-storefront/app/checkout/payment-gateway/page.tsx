"use client";

import dynamicImport from "next/dynamic";

// Dynamically import PaymentGateway to avoid SSR issues with React Query
const PaymentGateway = dynamicImport(
  () => import("@/components/pages/checkout/PaymentGateway"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function PaymentGatewayPage() {
  return <PaymentGateway />;
}
