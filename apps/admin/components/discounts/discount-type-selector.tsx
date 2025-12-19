"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscountType } from "@/lib/types/discounts";

interface DiscountTypeSelectorProps {
  value?: DiscountType;
  onValueChange: (value: DiscountType) => void;
}

const DISCOUNT_TYPES: {
  value: DiscountType;
  label: string;
  description: string;
}[] = [
  {
    value: DiscountType.FIXED_AMOUNT,
    label: "Fixed Amount",
    description: "Fixed discount amount (e.g., ₹100 off)",
  },
  {
    value: DiscountType.PERCENTAGE,
    label: "Percentage",
    description: "Percentage discount (e.g., 20% off)",
  },
  {
    value: DiscountType.BUY_X_GET_Y,
    label: "Buy X Get Y",
    description: "Buy X items, get Y items free or discounted",
  },
  {
    value: DiscountType.TIERED,
    label: "Tiered",
    description:
      "Discount increases with quantity (e.g., 10% off 3+, 20% off 5+)",
  },
  {
    value: DiscountType.CART_LEVEL,
    label: "Cart Level",
    description: "Discount applied to entire cart based on total",
  },
];

export function DiscountTypeSelector({
  value,
  onValueChange,
}: DiscountTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Discount Type</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select discount type" />
        </SelectTrigger>
        <SelectContent>
          {DISCOUNT_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div>
                <div className="font-medium">{type.label}</div>
                <div className="text-xs text-muted-foreground">
                  {type.description}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
