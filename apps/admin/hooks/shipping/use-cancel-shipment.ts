"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

interface CancelShipmentParams {
  awb: string;
}

export function useCancelShipment() {
  const queryClient = useQueryClient();

  return useApiMutation<
    { success: boolean; message: string },
    CancelShipmentParams
  >({
    mutationFn: async ({ awb }) => {
      const url = `/api/shipping/shiprocket/cancel/${awb}`;
      return api.post<{ success: boolean; message: string }>(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.shipping.listShipments],
      });
      toast.success("Shipment cancelled successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel shipment");
    },
  });
}
