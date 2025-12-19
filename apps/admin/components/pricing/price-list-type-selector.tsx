"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PriceListType } from "@/lib/types/price-lists";

interface PriceListTypeSelectorProps {
  value?: PriceListType;
  onValueChange: (value: PriceListType) => void;
}

const PRICE_LIST_TYPES: { value: PriceListType; label: string }[] = [
  { value: "B2C", label: "B2C (Business to Consumer)" },
  { value: "B2B", label: "B2B (Business to Business)" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "RETAIL", label: "Retail" },
  { value: "CUSTOM", label: "Custom" },
];

export function PriceListTypeSelector({
  value,
  onValueChange,
}: PriceListTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Price List Type</Label>
      <Select value={value || "CUSTOM"} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {PRICE_LIST_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
