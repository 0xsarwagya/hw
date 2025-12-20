"use client";

import { useState } from "react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { useBulkAdjustInventory } from "@/hooks/inventory/use-bulk-adjust-inventory";
import { useVariantsIndex } from "@/hooks/inventory/use-variants-index";
import type {
  BulkAdjustInventoryResponse,
  BulkAdjustmentItem,
} from "@/lib/types/inventory";
import { BulkAdjustEditor } from "./bulk-adjust-editor";
import { BulkAdjustResult } from "./bulk-adjust-result";
import { BulkAdjustReview } from "./bulk-adjust-review";
import { BulkAdjustUploader } from "./bulk-adjust-uploader";

type Step = "upload" | "edit" | "review" | "result";

/**
 * Client component for bulk adjust wizard
 */
export function BulkAdjustClient() {
  const [step, setStep] = useState<Step>("upload");
  const [items, setItems] = useState<BulkAdjustmentItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<number, string>
  >({});
  const [result, setResult] = useState<BulkAdjustInventoryResponse | null>(
    null,
  );

  const { data: variantsIndex } = useVariantsIndex();
  const bulkAdjust = useBulkAdjustInventory();

  const handleDataParsed = (parsedItems: BulkAdjustmentItem[]) => {
    setItems(parsedItems);
    validateItems(parsedItems);
    setStep("edit");
  };

  const validateItems = (itemsToValidate: BulkAdjustmentItem[]) => {
    const errors: Record<number, string> = {};

    itemsToValidate.forEach((item, index) => {
      if (!item.sku) {
        errors[index] = "SKU is required";
        return;
      }

      if (!variantsIndex?.variants.find((v) => v.sku === item.sku)) {
        errors[index] = "SKU not found";
        return;
      }

      if (item.quantity <= 0) {
        errors[index] = "Quantity must be greater than 0";
        return;
      }
    });

    setValidationErrors(errors);
  };

  const handleReview = () => {
    validateItems(items);
    setStep("review");
  };

  const handleSubmit = async () => {
    const validItems = items.filter((_, index) => !validationErrors[index]);

    try {
      const response = await bulkAdjust.mutateAsync({
        adjustments: validItems,
      });
      setResult(response);
      setStep("result");
    } catch (_error) {
      // Error handled by mutation hook
    }
  };

  return (
    <AdminPageLayout
      title="Bulk Adjust Inventory"
      description="Adjust inventory for multiple variants at once"
    >
      <div className="space-y-6">
        {step === "upload" && (
          <BulkAdjustUploader onDataParsed={handleDataParsed} />
        )}

        {step === "edit" && (
          <div className="space-y-4">
            <BulkAdjustEditor
              items={items}
              onItemsChange={(newItems) => {
                setItems(newItems);
                validateItems(newItems);
              }}
              variantsIndex={variantsIndex?.variants}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleReview}>Review</Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <BulkAdjustReview
              items={items}
              validationErrors={validationErrors}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("edit")}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  bulkAdjust.isPending ||
                  Object.keys(validationErrors).length === items.length
                }
              >
                {bulkAdjust.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
            <BulkAdjustResult result={result} />
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setStep("upload");
                  setItems([]);
                  setValidationErrors({});
                  setResult(null);
                }}
              >
                Start New
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
