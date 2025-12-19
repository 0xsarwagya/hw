"use client";

import { Suspense, useCallback } from "react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { OrderHeader } from "./order-header";
import { OrderLineItems } from "./order-line-items";
import { OrderSummary } from "./order-summary";
import { OrderShippingSection } from "./order-shipping-section";
import { OrderPaymentSection } from "./order-payment-section";
import { FulfillmentControls } from "./fulfillment-controls";
import { NotesCard } from "./notes-card";
import { OrderDetailSkeleton } from "@/components/skeletons/order-detail-skeleton";
import { useAdminOrder } from "@/hooks/orders/use-admin-order";
import { useAdminOrderTimeline } from "@/hooks/orders/use-admin-order-timeline";
import { useUpdateOrderStatus } from "@/hooks/orders/use-update-order-status";
import type { OrderStatus } from "@/lib/types/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { OrderErrorState } from "./order-error-state";
import { OrderTimelineLoadingSkeleton } from "./order-timeline-loading-skeleton";

// Lazy load heavy components
const OrderTimeline = dynamic(
  () => import("./order-timeline").then((mod) => ({ default: mod.OrderTimeline })),
  { loading: () => <OrderTimelineLoadingSkeleton /> }
);

const OrderActionsDropdown = dynamic(
  () =>
    import("./order-actions-dropdown").then((mod) => ({
      default: mod.OrderActionsDropdown,
    })),
  { loading: () => null }
);

interface OrderDetailClientProps {
  orderId: string;
}

/**
 * Client component for order detail page
 * Handles all client-side logic including data fetching and interactions
 */
export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const { data: order, isLoading: orderLoading, error: orderError } =
    useAdminOrder(orderId);
  const { data: timeline, isLoading: timelineLoading } =
    useAdminOrderTimeline(orderId);
  const updateStatusMutation = useUpdateOrderStatus();

  if (orderLoading) {
    return <OrderDetailSkeleton />;
  }

  if (orderError || !order) {
    if (orderError) {
      toast.error(orderError.message || "Failed to load order");
    }
    return <OrderErrorState error={orderError} />;
  }

  const handleStatusChange = useCallback(
    async (status: typeof order.status) => {
      try {
        await updateStatusMutation.mutateAsync({
          orderId: order.id,
          status,
        });
      } catch (error) {
        // Error handled by mutation hook
      }
    },
    [order.id, updateStatusMutation]
  );

  return (
    <AdminPageLayout
      title={`Order ${order.orderNumber}`}
      breadcrumbs={[
        { label: "Orders", href: "/orders" },
        { label: order.orderNumber },
      ]}
      actions={
        <Suspense fallback={null}>
          <OrderActionsDropdown order={order} />
        </Suspense>
      }
    >
      <OrderDetailContent
        order={order}
        timeline={timeline}
        timelineLoading={timelineLoading}
        onStatusChange={handleStatusChange}
        isStatusUpdating={updateStatusMutation.isPending}
      />
    </AdminPageLayout>
  );
}

interface OrderDetailContentProps {
  order: NonNullable<ReturnType<typeof useAdminOrder>["data"]>;
  timeline: ReturnType<typeof useAdminOrderTimeline>["data"];
  timelineLoading: boolean;
  onStatusChange: (status: OrderStatus) => Promise<void>;
  isStatusUpdating: boolean;
}

/**
 * Content component for order detail page
 * Separates layout from content for better organization
 */
function OrderDetailContent({
  order,
  timeline,
  timelineLoading,
  onStatusChange,
  isStatusUpdating,
}: OrderDetailContentProps) {
  return (
    <div className="space-y-6">
      <OrderHeader order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OrderLineItems order={order} />
          <OrderShippingSection order={order} />
          <OrderTimelineSection
            timeline={timeline}
            isLoading={timelineLoading}
          />
          <NotesCard />
        </div>
        <div className="space-y-6">
          <OrderSummary order={order} />
          <OrderPaymentSection order={order} />
          <FulfillmentControls
            currentStatus={order.status}
            onStatusChange={onStatusChange}
            disabled={isStatusUpdating}
          />
        </div>
      </div>
    </div>
  );
}

interface OrderTimelineSectionProps {
  timeline: ReturnType<typeof useAdminOrderTimeline>["data"];
  isLoading: boolean;
}

/**
 * Timeline section component with loading state
 */
function OrderTimelineSection({
  timeline,
  isLoading,
}: OrderTimelineSectionProps) {
  return (
    <Suspense fallback={<OrderTimelineLoadingSkeleton />}>
      {isLoading ? (
        <OrderTimelineLoadingSkeleton />
      ) : timeline ? (
        <OrderTimeline timeline={timeline} />
      ) : null}
    </Suspense>
  );
}

