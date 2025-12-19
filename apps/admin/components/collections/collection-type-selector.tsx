"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CollectionTypeSelectorProps {
  value: "manual" | "automatic";
  onChange: (value: "manual" | "automatic") => void;
}

export function CollectionTypeSelector({
  value,
  onChange,
}: CollectionTypeSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="grid grid-cols-2 gap-4"
    >
      <Card className={value === "manual" ? "border-primary" : ""}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual" className="cursor-pointer">
              <CardTitle>Manual Collection</CardTitle>
            </Label>
          </div>
          <CardDescription>
            Manually select products to include in this collection
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className={value === "automatic" ? "border-primary" : ""}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="automatic" id="automatic" />
            <Label htmlFor="automatic" className="cursor-pointer">
              <CardTitle>Automatic Collection</CardTitle>
            </Label>
          </div>
          <CardDescription>
            Automatically include products based on rules you define
          </CardDescription>
        </CardHeader>
      </Card>
    </RadioGroup>
  );
}
