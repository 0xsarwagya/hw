"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BulkAdjustmentItem } from "@/lib/types/inventory";

interface BulkAdjustReviewProps {
  items: BulkAdjustmentItem[];
  validationErrors: Record<number, string>;
}

/**
 * Review component showing preview of bulk adjustments before submission
 */
export function BulkAdjustReview({
  items,
  validationErrors,
}: BulkAdjustReviewProps) {
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Adjustments</CardTitle>
        <CardDescription>
          Review the adjustments before submitting. Items with errors will be
          skipped.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasErrors && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">
                {Object.keys(validationErrors).length} item(s) have errors
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {items.map((item, index) => {
            const error = validationErrors[index];
            return (
              <div
                key={`${item.sku}-${index}`}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  error
                    ? "border-destructive bg-destructive/5"
                    : "border-border"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {error ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <span className="font-mono font-medium">{item.sku}</span>
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                    <span className="text-muted-foreground">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {item.reason}
                    </span>
                  </div>
                  {error && (
                    <div className="mt-1 text-sm text-destructive">{error}</div>
                  )}
                  {item.note && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      Note: {item.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            Total items: {items.length}
          </span>
          <span className="text-sm text-muted-foreground">
            Valid: {items.length - Object.keys(validationErrors).length} /
            Invalid: {Object.keys(validationErrors).length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
