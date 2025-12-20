/**
 * Shipping Label PDF Template
 */

export interface ShippingLabelData {
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  service?: string;
  recipientName: string;
  recipientPhone?: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  weight?: string;
  dimensions?: string;
  barcode?: string;
}

/**
 * Generate shipping label HTML for PDF conversion
 */
export function generateShippingLabelHTML(data: ShippingLabelData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .label { border: 2px solid #000; padding: 20px; max-width: 400px; }
          .header { margin-bottom: 20px; }
          .order-number { font-size: 18px; font-weight: bold; }
          .tracking { margin-top: 10px; }
          .address { margin-top: 20px; line-height: 1.6; }
          .barcode { margin-top: 20px; text-align: center; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <div class="order-number">Order #${data.orderNumber}</div>
            ${data.trackingNumber ? `<div class="tracking">Tracking: ${data.trackingNumber}</div>` : ""}
            ${data.carrier ? `<div>Carrier: ${data.carrier}</div>` : ""}
            ${data.service ? `<div>Service: ${data.service}</div>` : ""}
          </div>

          <div class="address">
            <strong>Ship To:</strong><br>
            ${data.recipientName}<br>
            ${data.address.addressLine1}<br>
            ${data.address.addressLine2 ? `${data.address.addressLine2}<br>` : ""}
            ${data.address.city}, ${data.address.state} ${data.address.postalCode}<br>
            ${data.address.country}
            ${data.recipientPhone ? `<br>Phone: ${data.recipientPhone}` : ""}
          </div>

          ${
            data.barcode
              ? `
          <div class="barcode">
            <div style="font-family: monospace; font-size: 24px;">${data.barcode}</div>
          </div>
          `
              : ""
          }

          ${
            data.weight || data.dimensions
              ? `
          <div class="footer">
            ${data.weight ? `Weight: ${data.weight}` : ""}
            ${data.dimensions ? ` | Dimensions: ${data.dimensions}` : ""}
          </div>
          `
              : ""
          }
        </div>
      </body>
    </html>
  `;
}
