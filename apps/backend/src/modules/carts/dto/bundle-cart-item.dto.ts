import { UserBundleSelection } from "../../bundles/services/bundle-eligibility.service";

/**
 * Bundle snapshot stored in cart item metadata
 */
export interface BundleSnapshot {
  bundleId: string;
  bundleTitle: string;
  selections: UserBundleSelection;
  unitBundlePrice: number;
  variantBreakdown: Array<{
    variantId: string;
    unitPrice: number;
    quantity: number;
  }>;
}

/**
 * Bundle cart item metadata structure
 * Stored in cart_items.metadata JSONB column
 */
export interface BundleCartItemMetadata {
  type: "bundle";
  bundleId: string;
  selections: UserBundleSelection;
  bundleTitle?: string;
  bundleSnapshot?: BundleSnapshot;
}
