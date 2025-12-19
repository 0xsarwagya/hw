"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Money } from "../orders/money";

interface PricingEditorProps {
  price: number;
  gstRate?: number;
  pricingType?: "inclusive" | "exclusive";
  hsnCode?: string;
  onPriceChange: (price: number) => void;
  onGstRateChange: (rate: number | undefined) => void;
  onPricingTypeChange?: (type: "inclusive" | "exclusive") => void;
  onHsnCodeChange: (code: string | undefined) => void;
  showPreview?: boolean;
}

export function PricingEditor({
  price,
  gstRate = 0,
  pricingType = "exclusive",
  hsnCode,
  onPriceChange,
  onGstRateChange,
  onPricingTypeChange,
  onHsnCodeChange,
  showPreview = true,
}: PricingEditorProps) {
  // Calculate prices based on pricing type
  let gstAmount: number;
  let priceExcludingGst: number;
  let priceIncludingGst: number;

  if (pricingType === "inclusive") {
    // Price already includes GST
    priceIncludingGst = price;
    priceExcludingGst = gstRate > 0 ? (price * 100) / (100 + gstRate) : price;
    gstAmount = priceIncludingGst - priceExcludingGst;
  } else {
    // Price excludes GST (default)
    priceExcludingGst = price;
    gstAmount = (price * gstRate) / 100;
    priceIncludingGst = price + gstAmount;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pricing Type</Label>
        <RadioGroup
          value={pricingType}
          onValueChange={(value) =>
            onPricingTypeChange?.(value as "inclusive" | "exclusive")
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="exclusive" id="exclusive" />
            <Label htmlFor="exclusive" className="cursor-pointer font-normal">
              Tax Exclusive (GST added on top)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="inclusive" id="inclusive" />
            <Label htmlFor="inclusive" className="cursor-pointer font-normal">
              Tax Inclusive (GST included in price)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">
          {pricingType === "inclusive"
            ? "Price (INR) - Includes GST"
            : "Base Price (INR) - Excludes GST"}
        </Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price || ""}
          onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gstRate">GST Rate (%)</Label>
        <Select
          value={gstRate?.toString() || "0"}
          onValueChange={(value) =>
            onGstRateChange(value === "0" ? undefined : parseInt(value, 10))
          }
        >
          <SelectTrigger id="gstRate">
            <SelectValue placeholder="Select GST rate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0%</SelectItem>
            <SelectItem value="5">5%</SelectItem>
            <SelectItem value="12">12%</SelectItem>
            <SelectItem value="18">18%</SelectItem>
            <SelectItem value="28">28%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hsnCode">HSN Code</Label>
        <Input
          id="hsnCode"
          type="text"
          value={hsnCode || ""}
          onChange={(e) => onHsnCodeChange(e.target.value || undefined)}
          placeholder="e.g., 8518.12.00"
          maxLength={50}
        />
      </div>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Price Preview</CardTitle>
            <CardDescription>
              {pricingType === "inclusive"
                ? "Price breakdown (GST included)"
                : "Calculated prices including GST"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price (excl. GST):</span>
              <Money amount={priceExcludingGst} />
            </div>
            {gstRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({gstRate}%):</span>
                <Money amount={gstAmount} />
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Price (incl. GST):</span>
              <Money amount={priceIncludingGst} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
