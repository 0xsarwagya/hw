"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DiscountPrioritySelectorProps {
  value?: number;
  onValueChange: (value: number) => void;
}

export function DiscountPrioritySelector({
  value = 1,
  onValueChange,
}: DiscountPrioritySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Priority</Label>
      <Input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onValueChange(parseInt(e.target.value, 10) || 1)}
        placeholder="1"
      />
      <p className="text-xs text-muted-foreground">
        Lower numbers = higher priority. Discounts with lower priority are
        applied first.
      </p>
    </div>
  );
}
