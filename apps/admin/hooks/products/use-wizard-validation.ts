"use client";

import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateProductFormValues } from "@/lib/validations/products";
import type { ProductVariantOptionType } from "@/lib/types/products";
import { toast } from "sonner";
import { WIZARD_MESSAGES } from "@/lib/constants/wizard.constants";

interface PendingVariant {
  id: string;
  price: number;
  optionValueIds?: string[];
}

interface UseWizardValidationProps {
  form: UseFormReturn<CreateProductFormValues>;
  variantMode: "none" | "hasVariants";
  tempProductId: string | null;
  optionTypes: ProductVariantOptionType[];
  pendingVariants: PendingVariant[];
}

/**
 * Hook for validating wizard steps
 * Provides validation logic for each step of the product creation wizard
 */
export function useWizardValidation({
  form,
  variantMode,
  tempProductId,
  optionTypes,
  pendingVariants,
}: UseWizardValidationProps) {
  const validateVariantStep = useCallback((): boolean => {
    if (variantMode === "hasVariants") {
      if (tempProductId) {
        if (optionTypes.length === 0) {
          toast.error(WIZARD_MESSAGES.VALIDATION_OPTION_TYPES_REQUIRED);
          return false;
        }

        const hasEmptyOptionTypes = optionTypes.some(
          (ot) => !ot.values || ot.values.length === 0
        );
        if (hasEmptyOptionTypes) {
          toast.error(WIZARD_MESSAGES.VALIDATION_OPTION_VALUES_REQUIRED);
          return false;
        }

        if (pendingVariants.length === 0) {
          toast.error(WIZARD_MESSAGES.VALIDATION_VARIANTS_REQUIRED);
          return false;
        }

        for (const variant of pendingVariants) {
          if (!variant.price || variant.price < 0) {
            toast.error(WIZARD_MESSAGES.VALIDATION_VARIANT_PRICE_REQUIRED);
            return false;
          }
        }
      }
    }
    return true;
  }, [variantMode, tempProductId, optionTypes, pendingVariants]);

  const validateReviewStep = useCallback(async (): Promise<boolean> => {
    if (tempProductId && variantMode === "hasVariants") {
      if (pendingVariants.length === 0) {
        toast.error(WIZARD_MESSAGES.VALIDATION_VARIANTS_BEFORE_COMPLETE);
        return false;
      }

      for (const variant of pendingVariants) {
        if (!variant.price || variant.price < 0) {
          toast.error(WIZARD_MESSAGES.VALIDATION_VARIANT_PRICE_REQUIRED);
          return false;
        }
      }
    } else {
      return form.trigger(); // Validate all fields
    }
    return true;
  }, [form, tempProductId, variantMode, pendingVariants]);

  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      switch (step) {
        case 1:
          return form.trigger(["title"]);
        case 2:
          return form.trigger(["price"]);
        case 3:
          return true; // Images are optional
        case 4:
          return validateVariantStep();
        case 5:
          return validateReviewStep();
        default:
          return true;
      }
    },
    [form, validateVariantStep, validateReviewStep]
  );

  return { validateStep };
}

