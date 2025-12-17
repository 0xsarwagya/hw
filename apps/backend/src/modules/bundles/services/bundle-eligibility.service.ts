import { Injectable } from "@nestjs/common";
import { BundleDefinitionService } from "./bundle-definition.service";

export interface UserBundleSelection {
  [setId: string]: string[]; // setId -> array of variantIds
}

export interface BundleEligibilityResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class BundleEligibilityService {
  constructor(
    private readonly bundleDefinitionService: BundleDefinitionService,
  ) {}

  /**
   * Get full hydrated bundle structure
   */
  async getBundle(bundleId: string) {
    return this.bundleDefinitionService.findOne(bundleId);
  }

  /**
   * Validate user's bundle selection
   * Selection format: { setId1: [variantId1, variantId2], setId2: [variantId3] }
   */
  async validateUserSelection(
    bundleId: string,
    selection: UserBundleSelection,
  ): Promise<BundleEligibilityResult> {
    const errors: string[] = [];

    // Get bundle with all sets and items
    const bundle = await this.bundleDefinitionService.findOne(bundleId);

    if (!bundle) {
      return {
        isValid: false,
        errors: [`Bundle with ID ${bundleId} not found`],
      };
    }

    // Validate all sets are present in selection
    const setIds = bundle.sets.map((set) => set.id);
    const selectionSetIds = Object.keys(selection);

    // Check for missing sets
    const missingSets = setIds.filter((id) => !selectionSetIds.includes(id));
    if (missingSets.length > 0) {
      errors.push(`Missing selections for sets: ${missingSets.join(", ")}`);
    }

    // Check for extra sets (sets not in bundle)
    const extraSets = selectionSetIds.filter((id) => !setIds.includes(id));
    if (extraSets.length > 0) {
      errors.push(`Invalid sets in selection: ${extraSets.join(", ")}`);
    }

    // Validate each set's selection
    for (const set of bundle.sets) {
      const selectedVariants = selection[set.id] || [];

      // Check quantity constraints
      if (selectedVariants.length < set.minQuantity) {
        errors.push(
          `Set "${set.title}" requires at least ${set.minQuantity} selection(s), but ${selectedVariants.length} provided`,
        );
      }

      if (selectedVariants.length > set.maxQuantity) {
        errors.push(
          `Set "${set.title}" allows at most ${set.maxQuantity} selection(s), but ${selectedVariants.length} provided`,
        );
      }

      // Check for duplicates within set selection
      const uniqueVariants = new Set(selectedVariants);
      if (uniqueVariants.size !== selectedVariants.length) {
        errors.push(`Set "${set.title}" has duplicate variants in selection`);
      }

      // Validate each variant is allowed in the set
      const allowedVariantIds = set.items.map((item) => item.variantId);
      for (const variantId of selectedVariants) {
        if (!allowedVariantIds.includes(variantId)) {
          errors.push(
            `Variant ${variantId} is not allowed in set "${set.title}"`,
          );
        }
      }
    }

    // Check for duplicate variants across all sets (if bundle doesn't allow mix and match)
    if (!bundle.allowMixAndMatch) {
      const allSelectedVariants: string[] = [];
      for (const variants of Object.values(selection)) {
        allSelectedVariants.push(...variants);
      }

      const uniqueAllVariants = new Set(allSelectedVariants);
      if (uniqueAllVariants.size !== allSelectedVariants.length) {
        errors.push(
          "Duplicate variants found across sets (bundle does not allow mix and match)",
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
