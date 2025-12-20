/**
 * Packing Slip PDF Template
 */

export interface PackingSlipData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
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
  }>;
  notes?: string;
}

/**
 * Generate packing slip HTML for PDF conversion
 */
export function generatePackingSlipHTML(data: PackingSlipData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">PACKING SLIP</div>
          <div>Order #${data.orderNumber}</div>
          <div>Date: ${data.orderDate}</div>
        </div>

        <div class="section">
          <div class="section-title">Ship To:</div>
          <div>${data.customerName}</div>
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
              <th>Quantity</th>
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
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        ${
          data.notes
            ? `
        <div class="section">
          <div class="section-title">Notes:</div>
          <div>${data.notes}</div>
        </div>
        `
            : ""
        }
      </body>
    </html>
  `;
}
