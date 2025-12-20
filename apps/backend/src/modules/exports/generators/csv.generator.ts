import { Injectable } from "@nestjs/common";
import * as csv from "fast-csv";

@Injectable()
export class CsvGenerator {
  /**
   * Generate CSV from data array
   */
  async generate(
    data: Record<string, unknown>[],
    headers: string[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const stream = csv.format({ headers });

      stream.on("data", (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      stream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on("error", (error) => {
        reject(error);
      });

      // Write data rows
      for (const row of data) {
        const csvRow: Record<string, string> = {};
        for (const header of headers) {
          const value = row[header];
          csvRow[header] = value != null ? String(value) : "";
        }
        stream.write(csvRow);
      }

      stream.end();
    });
  }
}
