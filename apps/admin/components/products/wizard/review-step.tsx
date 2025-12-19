"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreateProductFormValues } from "@/lib/validations/products";
import type { ProductVariantOptionType } from "@/lib/types/products";
import { WIZARD_STEPS } from "@/lib/constants/wizard.constants";

interface PendingVariant {
  id: string;
  price: number;
  sku?: string;
  optionValueIds?: string[];
}

interface ReviewStepProps {
  formValues: CreateProductFormValues;
  pendingImages: File[];
  variantMode: "none" | "hasVariants";
  tempProductId: string | null;
  pendingVariants: PendingVariant[];
  optionTypes: ProductVariantOptionType[];
}

/**
 * Step 5: Review & Create
 * Displays summary of all entered information before submission
 */
export function ReviewStep({
  formValues,
  pendingImages,
  variantMode,
  tempProductId,
  pendingVariants,
  optionTypes,
}: ReviewStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{WIZARD_STEPS[4].title}</CardTitle>
        <CardDescription>{WIZARD_STEPS[4].description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <BasicInformationReview formValues={formValues} />
        <PricingReview formValues={formValues} />
        {pendingImages.length > 0 && <ImagesReview imageCount={pendingImages.length} />}
        <VariantsReview
          variantMode={variantMode}
          tempProductId={tempProductId}
          pendingVariants={pendingVariants}
          optionTypes={optionTypes}
        />
      </CardContent>
    </Card>
  );
}

interface BasicInformationReviewProps {
  formValues: CreateProductFormValues;
}

/**
 * Review section for basic information
 */
function BasicInformationReview({ formValues }: BasicInformationReviewProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Basic Information</h3>
      <div className="pl-4 space-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">Title:</span> {formValues.title}
        </div>
        {formValues.description && (
          <div>
            <span className="text-muted-foreground">Description:</span>{" "}
            {formValues.description}
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Status:</span> {formValues.status}
        </div>
      </div>
    </div>
  );
}

interface PricingReviewProps {
  formValues: CreateProductFormValues;
}

/**
 * Review section for pricing information
 */
function PricingReview({ formValues }: PricingReviewProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Pricing</h3>
      <div className="pl-4 space-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">Price:</span> ₹{formValues.price}
        </div>
        <div>
          <span className="text-muted-foreground">GST Rate:</span>{" "}
          {formValues.gstRate || 0}%
        </div>
        <div>
          <span className="text-muted-foreground">Pricing Type:</span>{" "}
          {formValues.pricingType === "inclusive" ? "Tax Inclusive" : "Tax Exclusive"}
        </div>
        {formValues.hsnCode && (
          <div>
            <span className="text-muted-foreground">HSN Code:</span> {formValues.hsnCode}
          </div>
        )}
      </div>
    </div>
  );
}

interface ImagesReviewProps {
  imageCount: number;
}

/**
 * Review section for images
 */
function ImagesReview({ imageCount }: ImagesReviewProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Images</h3>
      <div className="pl-4 text-sm">
        <span className="text-muted-foreground">
          {imageCount} image(s) ready to upload
        </span>
      </div>
    </div>
  );
}

interface VariantsReviewProps {
  variantMode: "none" | "hasVariants";
  tempProductId: string | null;
  pendingVariants: PendingVariant[];
  optionTypes: ProductVariantOptionType[];
}

/**
 * Review section for variants
 */
function VariantsReview({
  variantMode,
  tempProductId,
  pendingVariants,
  optionTypes,
}: VariantsReviewProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Variants</h3>
      <div className="pl-4 space-y-1 text-sm">
        {variantMode === "none" ? (
          <div>
            <span className="text-muted-foreground">
              Default variant will be created automatically
            </span>
          </div>
        ) : tempProductId ? (
          pendingVariants.length > 0 ? (
            <VariantsList
              variants={pendingVariants}
              optionTypes={optionTypes}
            />
          ) : (
            <div>
              <span className="text-muted-foreground">
                Product created. Go back to step 4 to create variants.
              </span>
            </div>
          )
        ) : (
          <div>
            <span className="text-muted-foreground">
              Variants will be created after product creation
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface VariantsListProps {
  variants: PendingVariant[];
  optionTypes: ProductVariantOptionType[];
}

/**
 * List of variants with their details
 */
function VariantsList({ variants, optionTypes }: VariantsListProps) {
  return (
    <>
      <div>
        <span className="text-muted-foreground">
          {variants.length} variant(s) ready to be created:
        </span>
      </div>
      {variants.map((variant, index) => {
        const optionValues = variant.optionValueIds
          ?.map((valueId) => {
            for (const optionType of optionTypes) {
              const value = optionType.values?.find((v) => v.id === valueId);
              if (value) {
                return `${optionType.name}: ${value.value}`;
              }
            }
            return null;
          })
          .filter(Boolean)
          .join(", ");

        return (
          <div key={variant.id} className="pl-4">
            <span className="text-muted-foreground">
              Variant {index + 1}: ₹{variant.price}
              {optionValues && ` - ${optionValues}`}
              {variant.sku && ` (SKU: ${variant.sku})`}
            </span>
          </div>
        );
      })}
    </>
  );
}

