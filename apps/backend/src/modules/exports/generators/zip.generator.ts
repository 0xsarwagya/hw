import { Injectable } from "@nestjs/common";
// @ts-expect-error - jszip types may not be available
import JSZip from "jszip";

@Injectable()
export class ZipGenerator {
  /**
   * Generate ZIP for orders (placeholder - bundles multiple files)
   */
  async generateOrders(data: Record<string, unknown>[]): Promise<Buffer> {
    const zip = new JSZip();
    // Add CSV file
    zip.file("orders.csv", this.dataToCsv(data));
    // Add JSON metadata
    zip.file(
      "metadata.json",
      JSON.stringify({
        count: data.length,
        exportedAt: new Date().toISOString(),
      }),
    );
    return zip.generateAsync({ type: "nodebuffer" });
  }

  /**
   * Generate ZIP for products
   */
  async generateProducts(data: Record<string, unknown>[]): Promise<Buffer> {
    const zip = new JSZip();
    zip.file("products.csv", this.dataToCsv(data));
    zip.file(
      "metadata.json",
      JSON.stringify({
        count: data.length,
        exportedAt: new Date().toISOString(),
      }),
    );
    return zip.generateAsync({ type: "nodebuffer" });
  }

  /**
   * Generate ZIP for customers
   */
  async generateCustomers(data: Record<string, unknown>[]): Promise<Buffer> {
    const zip = new JSZip();
    zip.file("customers.csv", this.dataToCsv(data));
    zip.file(
      "metadata.json",
      JSON.stringify({
        count: data.length,
        exportedAt: new Date().toISOString(),
      }),
    );
    return zip.generateAsync({ type: "nodebuffer" });
  }

  /**
   * Generate ZIP for inventory
   */
  async generateInventory(data: Record<string, unknown>[]): Promise<Buffer> {
    const zip = new JSZip();
    zip.file("inventory.csv", this.dataToCsv(data));
    zip.file(
      "metadata.json",
      JSON.stringify({
        count: data.length,
        exportedAt: new Date().toISOString(),
      }),
    );
    return zip.generateAsync({ type: "nodebuffer" });
  }

  /**
   * Convert data array to CSV string (simplified)
   */
  private dataToCsv(data: Record<string, unknown>[]): string {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        return value != null ? String(value) : "";
      }),
    );
    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }
}
