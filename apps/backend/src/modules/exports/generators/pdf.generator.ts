import { Injectable } from "@nestjs/common";
import type PDFKit from "pdfkit";
import PDFDocument from "pdfkit";

@Injectable()
export class PdfGenerator {
  /**
   * Generate PDF for orders
   */
  async generateOrders(data: Record<string, unknown>[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc.fontSize(20).text("Orders Export", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc.fontSize(10).text(`Total Orders: ${data.length}`, { align: "center" });
    doc.moveDown(2);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Order #", 50, tableTop);
    doc.text("Customer", 150, tableTop);
    doc.text("Total", 300, tableTop);
    doc.text("Status", 380, tableTop);
    doc.text("Date", 450, tableTop);

    // Draw line under header
    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke();
    doc.moveDown();

    // Table rows
    doc.font("Helvetica").fontSize(9);
    let y = doc.y;
    for (const order of data) {
      if (y > 750) {
        // New page
        doc.addPage();
        y = 50;
        // Redraw header
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Order #", 50, y);
        doc.text("Customer", 150, y);
        doc.text("Total", 300, y);
        doc.text("Status", 380, y);
        doc.text("Date", 450, y);
        doc
          .moveTo(50, y + 5)
          .lineTo(550, y + 5)
          .stroke();
        y += 15;
        doc.font("Helvetica").fontSize(9);
      }

      const orderNumber = String(
        order["Order Number"] || order["Order ID"] || "",
      );
      const customer = String(order.Customer || "N/A");
      const total =
        typeof order.Total === "number"
          ? `₹${order.Total.toFixed(2)}`
          : String(order.Total || "N/A");
      const status = String(order.Status || "N/A");
      const date = order["Created At"]
        ? new Date(String(order["Created At"])).toLocaleDateString()
        : "N/A";

      doc.text(orderNumber.substring(0, 20), 50, y);
      doc.text(customer.substring(0, 25), 150, y);
      doc.text(total, 300, y);
      doc.text(status, 380, y);
      doc.text(date, 450, y);

      y += 12;
      doc.y = y;
    }

    return this.pdfToBuffer(doc);
  }

  /**
   * Generate PDF for products
   */
  async generateProducts(data: Record<string, unknown>[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });

    doc.fontSize(20).text("Products Export", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc
      .fontSize(10)
      .text(`Total Products: ${data.length}`, { align: "center" });
    doc.moveDown(2);

    const tableTop = doc.y;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("SKU", 50, tableTop);
    doc.text("Product Title", 150, tableTop);
    doc.text("Price", 350, tableTop);
    doc.text("Stock", 420, tableTop);
    doc.text("Status", 480, tableTop);

    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke();
    doc.moveDown();

    doc.font("Helvetica").fontSize(9);
    let y = doc.y;
    for (const product of data) {
      if (y > 750) {
        doc.addPage();
        y = 50;
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("SKU", 50, y);
        doc.text("Product Title", 150, y);
        doc.text("Price", 350, y);
        doc.text("Stock", 420, y);
        doc.text("Status", 480, y);
        doc
          .moveTo(50, y + 5)
          .lineTo(550, y + 5)
          .stroke();
        y += 15;
        doc.font("Helvetica").fontSize(9);
      }

      const sku = String(product.SKU || "N/A");
      const title = String(product["Product Title"] || "N/A");
      const price =
        typeof product.Price === "number"
          ? `₹${product.Price.toFixed(2)}`
          : String(product.Price || "N/A");
      const stock = String(product.Stock || "0");
      const status = String(product.Status || "N/A");

      doc.text(sku.substring(0, 15), 50, y);
      doc.text(title.substring(0, 30), 150, y);
      doc.text(price, 350, y);
      doc.text(stock, 420, y);
      doc.text(status, 480, y);

      y += 12;
      doc.y = y;
    }

    return this.pdfToBuffer(doc);
  }

  /**
   * Generate PDF for customers
   */
  async generateCustomers(data: Record<string, unknown>[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });

    doc.fontSize(20).text("Customers Export", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc
      .fontSize(10)
      .text(`Total Customers: ${data.length}`, { align: "center" });
    doc.moveDown(2);

    const tableTop = doc.y;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Email", 50, tableTop);
    doc.text("Name", 250, tableTop);
    doc.text("Phone", 400, tableTop);
    doc.text("Created", 480, tableTop);

    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke();
    doc.moveDown();

    doc.font("Helvetica").fontSize(9);
    let y = doc.y;
    for (const customer of data) {
      if (y > 750) {
        doc.addPage();
        y = 50;
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Email", 50, y);
        doc.text("Name", 250, y);
        doc.text("Phone", 400, y);
        doc.text("Created", 480, y);
        doc
          .moveTo(50, y + 5)
          .lineTo(550, y + 5)
          .stroke();
        y += 15;
        doc.font("Helvetica").fontSize(9);
      }

      const email = String(customer.Email || "N/A");
      const name = String(customer.Name || "N/A");
      const phone = String(customer.Phone || "N/A");
      const created = customer["Created At"]
        ? new Date(String(customer["Created At"])).toLocaleDateString()
        : "N/A";

      doc.text(email.substring(0, 30), 50, y);
      doc.text(name.substring(0, 25), 250, y);
      doc.text(phone.substring(0, 15), 400, y);
      doc.text(created, 480, y);

      y += 12;
      doc.y = y;
    }

    return this.pdfToBuffer(doc);
  }

  /**
   * Generate PDF for inventory
   */
  async generateInventory(data: Record<string, unknown>[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });

    doc.fontSize(20).text("Inventory Export", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });
    doc
      .fontSize(10)
      .text(`Total Variants: ${data.length}`, { align: "center" });
    doc.moveDown(2);

    const tableTop = doc.y;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("SKU", 50, tableTop);
    doc.text("Product", 150, tableTop);
    doc.text("Quantity", 350, tableTop);
    doc.text("Reserved", 420, tableTop);
    doc.text("Available", 480, tableTop);

    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke();
    doc.moveDown();

    doc.font("Helvetica").fontSize(9);
    let y = doc.y;
    for (const item of data) {
      if (y > 750) {
        doc.addPage();
        y = 50;
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("SKU", 50, y);
        doc.text("Product", 150, y);
        doc.text("Quantity", 350, y);
        doc.text("Reserved", 420, y);
        doc.text("Available", 480, y);
        doc
          .moveTo(50, y + 5)
          .lineTo(550, y + 5)
          .stroke();
        y += 15;
        doc.font("Helvetica").fontSize(9);
      }

      const sku = String(item.SKU || "N/A");
      const product = String(item["Product Title"] || "N/A");
      const quantity = String(item.Quantity || "0");
      const reserved = String(item.Reserved || "0");
      const available = String(item.Available || "0");

      doc.text(sku.substring(0, 15), 50, y);
      doc.text(product.substring(0, 30), 150, y);
      doc.text(quantity, 350, y);
      doc.text(reserved, 420, y);
      doc.text(available, 480, y);

      y += 12;
      doc.y = y;
    }

    return this.pdfToBuffer(doc);
  }

  /**
   * Convert PDFDocument to Buffer
   */
  private pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", (error) => {
        reject(error);
      });

      doc.end();
    });
  }
}
