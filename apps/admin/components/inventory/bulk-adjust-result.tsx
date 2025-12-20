"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BulkAdjustInventoryResponse } from "@/lib/types/inventory";

interface BulkAdjustResultProps {
  result: BulkAdjustInventoryResponse;
}

/**
 * Result display component showing success/failure for each bulk adjustment
 */
export function BulkAdjustResult({ result }: BulkAdjustResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Adjustment Results</CardTitle>
        <CardDescription>
          {result.successful} successful, {result.failed} failed out of{" "}
          {result.total} total
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold">{result.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="rounded-lg border border-green-500 bg-green-50 p-4">
            <div className="text-2xl font-bold text-green-700">
              {result.successful}
            </div>
            <div className="text-sm text-green-600">Successful</div>
          </div>
          <div className="rounded-lg border border-red-500 bg-red-50 p-4">
            <div className="text-2xl font-bold text-red-700">
              {result.failed}
            </div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
        </div>

        <div className="space-y-2">
          {result.results.map((item, index) => (
            <div
              key={`${item.sku}-${index}`}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                item.success
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {item.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-mono font-medium">{item.sku}</span>
                {item.success && item.adjustmentId && (
                  <Badge variant="outline" className="text-xs">
                    ID: {item.adjustmentId.slice(0, 8)}...
                  </Badge>
                )}
              </div>
              {item.error && (
                <div className="text-sm text-red-600">{item.error}</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
