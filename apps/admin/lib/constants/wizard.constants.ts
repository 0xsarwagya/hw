/**
 * Constants for product creation wizard
 * Centralizes wizard configuration and messages
 */

export interface WizardStep {
  id: number;
  title: string;
  description: string;
}

export const WIZARD_STEPS: readonly WizardStep[] = [
  {
    id: 1,
    title: "Basic Information",
    description: "Product details and description",
  },
  {
    id: 2,
    title: "Pricing & Tax",
    description: "Set price and tax information",
  },
  { id: 3, title: "Images", description: "Upload product images" },
  { id: 4, title: "Variants", description: "Add product variants" },
  { id: 5, title: "Review & Create", description: "Review and submit" },
] as const;

export const WIZARD_MESSAGES = {
  IMAGE_UPLOAD_SUCCESS: "Images uploaded successfully",
  IMAGE_UPLOAD_ERROR: "Some images failed to upload. You can add them later.",
  DEFAULT_VARIANT_SUCCESS: "Default variant created",
  DEFAULT_VARIANT_ERROR:
    "Failed to create default variant. You can create it manually.",
  VARIANTS_CREATE_SUCCESS: (count: number) =>
    `${count} variant(s) created successfully`,
  VARIANTS_CREATE_ERROR:
    "Some variants failed to create. You can add them manually.",
  PRODUCT_CREATE_SUCCESS: "Product created successfully",
  PRODUCT_CREATE_ERROR: "Failed to create product",
  PRODUCT_CREATE_VARIANTS_PENDING: "Product created. Now create variants.",
  PRODUCT_VARIANTS_COMPLETE_SUCCESS:
    "Product and variants created successfully",
  VARIANTS_COMPLETE_ERROR: "Failed to create variants",
  VALIDATION_OPTION_TYPES_REQUIRED:
    "Please add at least one variant option type",
  VALIDATION_OPTION_VALUES_REQUIRED:
    "All option types must have at least one value",
  VALIDATION_VARIANTS_REQUIRED: "Please create at least one variant",
  VALIDATION_VARIANT_PRICE_REQUIRED: "All variants must have a valid price",
  VALIDATION_VARIANTS_BEFORE_COMPLETE:
    "Please create at least one variant before completing",
} as const;

export const WIZARD_BUTTON_LABELS = {
  PREVIOUS: "Previous",
  NEXT: "Next",
  CREATE_PRODUCT: "Create Product",
  CREATING: "Creating...",
  CREATING_VARIANTS: "Creating Variants...",
  COMPLETE_VARIANTS: "Complete & Create Variants",
  GO_BACK_TO_VARIANTS: "Go Back to Create Variants",
} as const;
