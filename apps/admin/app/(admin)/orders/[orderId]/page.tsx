import { use } from "react";
import { OrderDetailClient } from "@/components/orders/order-detail-client";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

/**
 * Order detail page - Server component
 * Extracts orderId from params and delegates to client component
 */
export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = use(params);
  return <OrderDetailClient orderId={orderId} />;
}
