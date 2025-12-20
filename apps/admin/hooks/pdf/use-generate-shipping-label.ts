"use client";

import { useMutation } from "@tanstack/react-query";
import {
  generateShippingLabelHTML,
  ShippingLabelData,
} from "@/components/pdf/shipping-label-template";
import { apiFetch } from "@/lib/api";
import { downloadPDF, generatePDFFromHTML } from "@/lib/pdf/generator";

/**
 * Hook to generate and download shipping label PDF
 */
export function useGenerateShippingLabel() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Fetch shipping label data
      const labelData = await apiFetch<ShippingLabelData>(
        `/admin/orders/${orderId}/shipping-label-data`,
      );

      // Generate HTML
      const html = generateShippingLabelHTML(labelData);

      // Convert to PDF
      const pdfBlob = await generatePDFFromHTML(html, {
        title: `Shipping Label ${labelData.orderNumber}`,
      });

      // Download PDF
      downloadPDF(pdfBlob, `shipping-label-${labelData.orderNumber}.pdf`);
    },
  });
}
