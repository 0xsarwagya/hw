"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Order } from "@/lib/types/orders";
import { useApiMutation } from "../use-api-mutation";

interface DuplicateOrderDto {
  shippingAddressId?: string;
  billingAddressId?: string;
  discountCode?: string;
}

interface DuplicateOrderParams {
  orderId: string;
  duplicateDto?: DuplicateOrderDto;
}

export function useDuplicateOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<Order, DuplicateOrderParams>({
    mutationFn: async ({ orderId, duplicateDto }) => {
      return api.post<Order>(
        `/admin/orders/${orderId}/duplicate`,
        duplicateDto || {},
      );
    },
    onSuccess: (data) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.list] });
      toast.success(
        `Order duplicated successfully. New order: ${data.orderNumber}`,
      );
      // Navigate to the new order
      router.push(`/orders/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to duplicate order");
    },
  });
}
