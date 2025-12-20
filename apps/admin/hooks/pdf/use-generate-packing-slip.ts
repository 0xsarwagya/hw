"use client";

import { useMutation } from "@tanstack/react-query";
import {
  generatePackingSlipHTML,
  PackingSlipData,
} from "@/components/pdf/packing-slip-template";
import { apiFetch } from "@/lib/api";
import { downloadPDF, generatePDFFromHTML } from "@/lib/pdf/generator";

/**
 * Hook to generate and download packing slip PDF
 */
export function useGeneratePackingSlip() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Fetch packing slip data
      const slipData = await apiFetch<PackingSlipData>(
        `/admin/orders/${orderId}/packing-slip-data`,
      );

      // Generate HTML
      const html = generatePackingSlipHTML(slipData);

      // Convert to PDF
      const pdfBlob = await generatePDFFromHTML(html, {
        title: `Packing Slip ${slipData.orderNumber}`,
      });

      // Download PDF
      downloadPDF(pdfBlob, `packing-slip-${slipData.orderNumber}.pdf`);
    },
  });
}
