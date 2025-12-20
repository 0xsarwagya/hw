/**
 * Invoice PDF Template
 *
 * Note: This is a placeholder template structure.
 * In production, you would use @react-pdf/renderer or similar library.
 */

export interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  gstNumber?: string;
  invoiceNumber: string;
}

/**
 * Generate invoice HTML for PDF conversion
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .invoice-title { font-size: 24px; font-weight: bold; }
          .section { margin-bottom: 30px; }
          .section-title { font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; }
          .text-right { text-align: right; }
          .total-row { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div>Invoice #${data.invoiceNumber}</div>
            <div>Order #${data.orderNumber}</div>
            <div>Date: ${data.orderDate}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Bill To:</div>
          <div>${data.customerName}</div>
          <div>${data.customerEmail}</div>
          ${data.customerPhone ? `<div>${data.customerPhone}</div>` : ""}
          <div>
            ${data.billingAddress.addressLine1}<br>
            ${data.billingAddress.addressLine2 ? `${data.billingAddress.addressLine2}<br>` : ""}
            ${data.billingAddress.city}, ${data.billingAddress.state} ${data.billingAddress.postalCode}<br>
            ${data.billingAddress.country}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Ship To:</div>
          <div>
            ${data.shippingAddress.addressLine1}<br>
            ${data.shippingAddress.addressLine2 ? `${data.shippingAddress.addressLine2}<br>` : ""}
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
            ${data.shippingAddress.country}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item</th>
              <th>Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items
              .map(
                (item) => `
              <tr>
                <td>${item.sku}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td class="text-right">${item.unitPrice}</td>
                <td class="text-right">${item.total}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right">Subtotal:</td>
              <td class="text-right">${data.subtotal}</td>
            </tr>
            ${
              data.shipping !== "0"
                ? `
            <tr>
              <td colspan="4" class="text-right">Shipping:</td>
              <td class="text-right">${data.shipping}</td>
            </tr>
            `
                : ""
            }
            ${
              data.tax !== "0"
                ? `
            <tr>
              <td colspan="4" class="text-right">Tax:</td>
              <td class="text-right">${data.tax}</td>
            </tr>
            `
                : ""
            }
            ${
              data.discount !== "0"
                ? `
            <tr>
              <td colspan="4" class="text-right">Discount:</td>
              <td class="text-right">-${data.discount}</td>
            </tr>
            `
                : ""
            }
            <tr class="total-row">
              <td colspan="4" class="text-right">Total:</td>
              <td class="text-right">${data.total}</td>
            </tr>
          </tfoot>
        </table>

        <div class="section">
          <div><strong>Payment Method:</strong> ${data.paymentMethod}</div>
          <div><strong>Payment Status:</strong> ${data.paymentStatus}</div>
          ${data.gstNumber ? `<div><strong>GST Number:</strong> ${data.gstNumber}</div>` : ""}
        </div>
      </body>
    </html>
  `;
}
