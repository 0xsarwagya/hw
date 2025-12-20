"use client";

import { useMutation } from "@tanstack/react-query";
import {
  generateInvoiceHTML,
  InvoiceData,
} from "@/components/pdf/invoice-template";
import { apiFetch } from "@/lib/api";
import { downloadPDF, generatePDFFromHTML } from "@/lib/pdf/generator";

/**
 * Hook to generate and download invoice PDF
 */
export function useGenerateInvoice() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Fetch order data
      const orderData = await apiFetch<InvoiceData>(
        `/admin/orders/${orderId}/invoice-data`,
      );

      // Generate HTML
      const html = generateInvoiceHTML(orderData);

      // Convert to PDF (placeholder - requires actual PDF library)
      const pdfBlob = await generatePDFFromHTML(html, {
        title: `Invoice ${orderData.invoiceNumber}`,
      });

      // Download PDF
      downloadPDF(pdfBlob, `invoice-${orderData.invoiceNumber}.pdf`);
    },
  });
}
