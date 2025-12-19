"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Truck, CheckCircle } from "lucide-react";
import type { OrderStatus } from "@/lib/types/orders";

interface FulfillmentControlsProps {
  currentStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  disabled?: boolean;
}

export function FulfillmentControls({
  currentStatus,
  onStatusChange,
  disabled = false,
}: FulfillmentControlsProps) {
  const getNextStatus = (): OrderStatus | null => {
    switch (currentStatus) {
      case "pending":
        return "confirmed";
      case "confirmed":
        return "processing";
      case "processing":
        return "shipped";
      case "shipped":
        return "delivered";
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();
  const statusLabels: Record<OrderStatus, string> = {
    pending: "Confirm Order",
    confirmed: "Start Processing",
    processing: "Mark as Shipped",
    shipped: "Mark as Delivered",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  const getIcon = (status: OrderStatus) => {
    switch (status) {
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (nextStatus && currentStatus !== "delivered" && currentStatus !== "cancelled" && currentStatus !== "refunded") {
    return (
      <Button
        onClick={() => onStatusChange(nextStatus)}
        disabled={disabled}
        className="w-full"
      >
        {getIcon(nextStatus)}
        <span className="ml-2">{statusLabels[nextStatus]}</span>
      </Button>
    );
  }

  return (
    <Select
      value={currentStatus}
      onValueChange={(value) => onStatusChange(value as OrderStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="confirmed">Confirmed</SelectItem>
        <SelectItem value="processing">Processing</SelectItem>
        <SelectItem value="shipped">Shipped</SelectItem>
        <SelectItem value="delivered">Delivered</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
        <SelectItem value="refunded">Refunded</SelectItem>
      </SelectContent>
    </Select>
  );
}

