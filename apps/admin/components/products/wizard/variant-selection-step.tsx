"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { VariantOptionTypeManager } from "../variant-option-type-manager";
import { VariantCreator, type PendingVariant as CreatorPendingVariant } from "../variant-creator";
import type { ProductVariantOptionType } from "@/lib/types/products";
import { WIZARD_STEPS } from "@/lib/constants/wizard.constants";

export type VariantMode = "none" | "hasVariants";

interface VariantSelectionStepProps {
  variantMode: VariantMode;
  onVariantModeChange: (mode: VariantMode) => void;
  tempProductId: string | null;
  optionTypes: ProductVariantOptionType[];
  defaultPrice: number;
  onVariantsChange: (variants: CreatorPendingVariant[]) => void;
}

/**
 * Step 4: Variant Selection
 * Handles variant mode selection and variant creation
 */
export function VariantSelectionStep({
  variantMode,
  onVariantModeChange,
  tempProductId,
  optionTypes,
  defaultPrice,
  onVariantsChange,
}: VariantSelectionStepProps) {
  const handleModeChange = (value: string) => {
    const mode = value as VariantMode;
    onVariantModeChange(mode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{WIZARD_STEPS[3].title}</CardTitle>
        <CardDescription>{WIZARD_STEPS[3].description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <VariantModeSelector
          value={variantMode}
          onValueChange={handleModeChange}
        />

        {variantMode === "hasVariants" && (
          <VariantCreationSection
            tempProductId={tempProductId}
            optionTypes={optionTypes}
            defaultPrice={defaultPrice}
            onVariantsChange={onVariantsChange}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface VariantModeSelectorProps {
  value: VariantMode;
  onValueChange: (value: string) => void;
}

/**
 * Radio group for selecting variant mode
 */
function VariantModeSelector({ value, onValueChange }: VariantModeSelectorProps) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="none" id="none" />
        <Label htmlFor="none" className="cursor-pointer">
          No Variants - Create a default variant automatically
        </Label>
      </div>
      <div className="flex items-center space-x-2 mt-2">
        <RadioGroupItem value="hasVariants" id="hasVariants" />
        <Label htmlFor="hasVariants" className="cursor-pointer">
          Has Variants - Add variants now
        </Label>
      </div>
    </RadioGroup>
  );
}

interface VariantCreationSectionProps {
  tempProductId: string | null;
  optionTypes: ProductVariantOptionType[];
  defaultPrice: number;
  onVariantsChange: (variants: CreatorPendingVariant[]) => void;
}

/**
 * Section for creating variants after product is created
 */
function VariantCreationSection({
  tempProductId,
  optionTypes,
  defaultPrice,
  onVariantsChange,
}: VariantCreationSectionProps) {
  if (!tempProductId) {
    return (
      <div className="mt-6 p-4 bg-muted rounded-md">
        <p className="text-sm text-muted-foreground">
          Variant option types can be managed after product creation. Continue to
          the next step to create the product first.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <VariantOptionTypeManager productId={tempProductId} />
      {optionTypes.length > 0 && (
        <VariantCreator
          optionTypes={optionTypes}
          onVariantsChange={onVariantsChange}
          defaultPrice={defaultPrice}
        />
      )}
    </div>
  );
}

