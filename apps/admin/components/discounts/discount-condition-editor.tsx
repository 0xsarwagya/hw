"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DiscountConditionEditorProps {
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  customerGroupIds?: string | null;
  onMinOrderAmountChange: (value: number | null) => void;
  onMaxDiscountAmountChange: (value: number | null) => void;
  onUsageLimitChange: (value: number | null) => void;
  onPerUserLimitChange: (value: number | null) => void;
  onCustomerGroupIdsChange: (value: string | null) => void;
}

export function DiscountConditionEditor({
  minOrderAmount,
  maxDiscountAmount,
  usageLimit,
  perUserLimit,
  customerGroupIds,
  onMinOrderAmountChange,
  onMaxDiscountAmountChange,
  onUsageLimitChange,
  onPerUserLimitChange,
  onCustomerGroupIdsChange,
}: DiscountConditionEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Conditions</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Set conditions for when this discount can be applied
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Minimum Order Amount (INR)</Label>
          <Input
            type="number"
            min="0"
            value={minOrderAmount || ""}
            onChange={(e) =>
              onMinOrderAmountChange(
                e.target.value ? parseFloat(e.target.value) : null,
              )
            }
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Minimum cart total required
          </p>
        </div>

        <div className="space-y-2">
          <Label>Maximum Discount Amount (INR)</Label>
          <Input
            type="number"
            min="0"
            value={maxDiscountAmount || ""}
            onChange={(e) =>
              onMaxDiscountAmountChange(
                e.target.value ? parseFloat(e.target.value) : null,
              )
            }
            placeholder="Unlimited"
          />
          <p className="text-xs text-muted-foreground">
            Cap for percentage discounts
          </p>
        </div>

        <div className="space-y-2">
          <Label>Total Usage Limit</Label>
          <Input
            type="number"
            min="1"
            value={usageLimit || ""}
            onChange={(e) =>
              onUsageLimitChange(
                e.target.value ? parseInt(e.target.value, 10) : null,
              )
            }
            placeholder="Unlimited"
          />
          <p className="text-xs text-muted-foreground">
            Total times this discount can be used
          </p>
        </div>

        <div className="space-y-2">
          <Label>Per User Limit</Label>
          <Input
            type="number"
            min="1"
            value={perUserLimit || ""}
            onChange={(e) =>
              onPerUserLimitChange(
                e.target.value ? parseInt(e.target.value, 10) : null,
              )
            }
            placeholder="Unlimited"
          />
          <p className="text-xs text-muted-foreground">
            Times a single user can use this discount
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Customer Group IDs (JSON array)</Label>
        <Textarea
          value={customerGroupIds || ""}
          onChange={(e) => onCustomerGroupIdsChange(e.target.value || null)}
          placeholder='["vip", "premium"]'
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          JSON array of customer group IDs that can use this discount
        </p>
      </div>
    </div>
  );
}
