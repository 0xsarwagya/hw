"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BulkAdjustmentItem } from "@/lib/types/inventory";

interface BulkAdjustUploaderProps {
  onDataParsed: (items: BulkAdjustmentItem[]) => void;
}

/**
 * Component for uploading CSV or manually entering bulk adjustment data
 */
export function BulkAdjustUploader({ onDataParsed }: BulkAdjustUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        throw new Error("File is empty");
      }

      // Skip header row if present
      const headerLine = lines[0]?.toLowerCase();
      const hasHeader =
        headerLine?.includes("sku") || headerLine?.includes("type");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      if (dataLines.length === 0) {
        throw new Error("No data rows found in file");
      }

      const items: BulkAdjustmentItem[] = dataLines.map((line, index) => {
        // Handle CSV with quoted values
        const parts = line
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, ""));
        const [sku, type, quantity, reason, note] = parts;

        if (!sku || !type || !quantity || !reason) {
          throw new Error(
            `Invalid data on line ${index + (hasHeader ? 2 : 1)}: missing required fields (SKU, Type, Quantity, Reason)`,
          );
        }

        const parsedQuantity = parseInt(quantity, 10);
        if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
          throw new Error(
            `Invalid quantity on line ${index + (hasHeader ? 2 : 1)}: must be a positive number`,
          );
        }

        const validTypes: BulkAdjustmentItem["type"][] = [
          "increase",
          "decrease",
          "set",
        ];
        if (
          !validTypes.includes(type.toLowerCase() as BulkAdjustmentItem["type"])
        ) {
          throw new Error(
            `Invalid type on line ${index + (hasHeader ? 2 : 1)}: must be one of ${validTypes.join(", ")}`,
          );
        }

        const validReasons: BulkAdjustmentItem["reason"][] = [
          "received",
          "correction",
          "damaged",
          "lost",
          "returned",
          "giveaway",
          "manual",
        ];
        if (
          !validReasons.includes(
            reason.toLowerCase() as BulkAdjustmentItem["reason"],
          )
        ) {
          throw new Error(
            `Invalid reason on line ${index + (hasHeader ? 2 : 1)}: must be one of ${validReasons.join(", ")}`,
          );
        }

        return {
          sku: sku.trim(),
          type: type.toLowerCase() as BulkAdjustmentItem["type"],
          quantity: parsedQuantity,
          reason: reason.toLowerCase() as BulkAdjustmentItem["reason"],
          note: note?.trim() || undefined,
        };
      });

      if (items.length === 0) {
        throw new Error("No valid items found in file");
      }

      onDataParsed(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <CardDescription>
          Upload a CSV file with columns: SKU, Type, Quantity, Reason, Note
          (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose CSV File
          </Button>
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
      </CardContent>
    </Card>
  );
}
