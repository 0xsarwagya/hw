import type { Variant } from "../lib/validations/product";

/**
 * Find variant by size and optional color
 */
export function findVariantBySizeColor(
  variants: Variant[],
  size: string,
  color?: string,
): Variant | null {
  if (!variants || variants.length === 0) return null;

  // First try to find exact match (size + color)
  if (color) {
    const exactMatch = variants.find(
      (v) => v.size === size && v.color === color,
    );
    if (exactMatch) return exactMatch;
  }

  // Fallback to size match
  const sizeMatch = variants.find((v) => v.size === size);
  if (sizeMatch) return sizeMatch;

  // Last resort: return first variant
  return variants[0] || null;
}

/**
 * Extract unique sizes from variants
 */
export function getUniqueSizes(variants: Variant[]): string[] {
  if (!variants || variants.length === 0) return [];
  const sizes = variants
    .map((v) => v.size)
    .filter((size): size is string => !!size);
  return Array.from(new Set(sizes)).sort();
}

/**
 * Extract unique colors from variants
 */
export function getUniqueColors(variants: Variant[]): string[] {
  if (!variants || variants.length === 0) return [];
  const colors = variants
    .map((v) => v.color)
    .filter((color): color is string => !!color);
  return Array.from(new Set(colors)).sort();
}

/**
 * Get variant images (if variants have image associations)
 */
export function getVariantImages(variants: Variant[]): string[] {
  // This would need to be implemented based on how images are associated with variants
  // For now, return empty array
  return [];
}
