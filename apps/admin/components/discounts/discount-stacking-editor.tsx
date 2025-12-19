"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DiscountStackingEditorProps {
  canStack: boolean;
  mutuallyExclusive: boolean;
  onCanStackChange: (value: boolean) => void;
  onMutuallyExclusiveChange: (value: boolean) => void;
}

export function DiscountStackingEditor({
  canStack,
  mutuallyExclusive,
  onCanStackChange,
  onMutuallyExclusiveChange,
}: DiscountStackingEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Stacking Rules</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Configure how this discount interacts with other discounts
        </p>
      </div>

      <div className="flex items-start space-x-3 rounded-md border p-4">
        <Checkbox
          id="canStack"
          checked={canStack}
          onCheckedChange={(checked) => onCanStackChange(checked === true)}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="canStack" className="cursor-pointer">
            Can Stack with Other Discounts
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow this discount to be combined with other discounts
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-3 rounded-md border p-4">
        <Checkbox
          id="mutuallyExclusive"
          checked={mutuallyExclusive}
          onCheckedChange={(checked) =>
            onMutuallyExclusiveChange(checked === true)
          }
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="mutuallyExclusive" className="cursor-pointer">
            Mutually Exclusive
          </Label>
          <p className="text-sm text-muted-foreground">
            This discount cannot be combined with any other discounts
          </p>
        </div>
      </div>
    </div>
  );
}
