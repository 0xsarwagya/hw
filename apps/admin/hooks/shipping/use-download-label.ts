"use client";

import { toast } from "sonner";
import { api } from "@/lib/api";

interface DownloadLabelParams {
  shipmentId: string;
  awb: string;
}

export function useDownloadLabel() {
  return {
    downloadLabel: async ({ shipmentId }: DownloadLabelParams) => {
      try {
        // Fetch label URL from backend
        const response = await api.get<{ labelUrl: string }>(
          `/api/shipping/shipments/${shipmentId}/label`,
        );

        if (response.labelUrl) {
          // Open label in new tab
          window.open(response.labelUrl, "_blank");
          toast.success("Label downloaded");
        } else {
          toast.error("Label URL not available");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to download label",
        );
      }
    },
  };
}
