"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { DiscountApplicationType } from "@/lib/types/discounts";

interface DiscountApplicationTypeSelectorProps {
  value?: DiscountApplicationType;
  onValueChange: (value: DiscountApplicationType) => void;
}

export function DiscountApplicationTypeSelector({
  value = "MANUAL",
  onValueChange,
}: DiscountApplicationTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Application Type</Label>
      <RadioGroup value={value} onValueChange={onValueChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="MANUAL" id="manual" />
          <Label htmlFor="manual" className="font-normal cursor-pointer">
            Manual - Requires discount code
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="AUTOMATIC" id="automatic" />
          <Label htmlFor="automatic" className="font-normal cursor-pointer">
            Automatic - Applied automatically when conditions are met
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
