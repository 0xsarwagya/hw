"use client";

import dynamic from "next/dynamic";
import { use } from "react";

// Dynamically import OrderConfirmation to avoid SSR issues with React Query
const OrderConfirmation = dynamic(
  () => import("@/components/pages/checkout/OrderConfirmation"),
  { ssr: false },
);

export default function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  return <OrderConfirmation />;
}
