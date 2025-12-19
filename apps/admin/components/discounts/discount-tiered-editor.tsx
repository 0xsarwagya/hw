"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscountValueType, type TieredRule } from "@/lib/types/discounts";

interface DiscountTieredEditorProps {
  tieredRules?: TieredRule[];
  onTieredRulesChange: (rules: TieredRule[]) => void;
}

export function DiscountTieredEditor({
  tieredRules = [],
  onTieredRulesChange,
}: DiscountTieredEditorProps) {
  const [newRule, setNewRule] = useState<Partial<TieredRule>>({
    minQuantity: 1,
    value: 0,
    valueType: DiscountValueType.PERCENTAGE,
  });

  const handleAddRule = () => {
    if (
      newRule.minQuantity &&
      newRule.value !== undefined &&
      newRule.valueType
    ) {
      onTieredRulesChange([
        ...tieredRules,
        {
          minQuantity: newRule.minQuantity,
          value: newRule.value,
          valueType: newRule.valueType,
        },
      ]);
      setNewRule({
        minQuantity: Math.max(...tieredRules.map((r) => r.minQuantity), 0) + 1,
        value: 0,
        valueType: DiscountValueType.PERCENTAGE,
      });
    }
  };

  const handleRemoveRule = (index: number) => {
    onTieredRulesChange(tieredRules.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (
    index: number,
    field: keyof TieredRule,
    value: number | DiscountValueType,
  ) => {
    const updated = [...tieredRules];
    updated[index] = { ...updated[index], [field]: value };
    onTieredRulesChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Tiered Pricing Rules</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Define quantity-based discount tiers. Rules should be ordered by
          minimum quantity.
        </p>
      </div>

      {tieredRules.length > 0 && (
        <div className="space-y-2">
          {tieredRules.map((rule, index) => (
            <div
              key={`tier-${rule.minQuantity}-${rule.value}-${index}`}
              className="flex items-center gap-2 p-3 border rounded-lg"
            >
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Min Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rule.minQuantity}
                    onChange={(e) =>
                      handleUpdateRule(
                        index,
                        "minQuantity",
                        parseInt(e.target.value, 10) || 1,
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    type="number"
                    min="0"
                    max={rule.valueType === "PERCENTAGE" ? 100 : undefined}
                    value={rule.value}
                    onChange={(e) =>
                      handleUpdateRule(
                        index,
                        "value",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={rule.valueType}
                    onValueChange={(v) =>
                      handleUpdateRule(
                        index,
                        "valueType",
                        v as DiscountValueType,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="AMOUNT">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveRule(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Min Quantity</Label>
            <Input
              type="number"
              min="1"
              value={newRule.minQuantity || ""}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  minQuantity: parseInt(e.target.value, 10) || 1,
                })
              }
              placeholder="1"
            />
          </div>
          <div>
            <Label className="text-xs">Value</Label>
            <Input
              type="number"
              min="0"
              max={
                newRule.valueType === DiscountValueType.PERCENTAGE
                  ? 100
                  : undefined
              }
              value={newRule.value || ""}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  value: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select
              value={newRule.valueType || "PERCENTAGE"}
              onValueChange={(v) =>
                setNewRule({ ...newRule, valueType: v as DiscountValueType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="AMOUNT">Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddRule}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>
      </div>
    </div>
  );
}
