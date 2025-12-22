/**
 * Generate URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w-]+/g, "") // Remove non-word chars
    .replace(/--+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+/, "") // Remove leading hyphens
    .replace(/-+$/, ""); // Remove trailing hyphens
}

/**
 * Extract ID from slug (if slug contains ID)
 * Or generate slug from product title + ID
 */
export function createProductSlug(title: string, id: string): string {
  const titleSlug = slugify(title);
  // Append last 8 chars of ID for uniqueness
  const shortId = id.slice(-8);
  return `${titleSlug}-${shortId}`;
}

/**
 * Create bundle slug from title and ID
 */
export function createBundleSlug(title: string, id: string): string {
  const titleSlug = slugify(title);
  const shortId = id.slice(-8);
  return `${titleSlug}-${shortId}`;
}

/**
 * Extract ID from product slug
 */
export function extractIdFromSlug(slug: string): string | null {
  // If slug ends with UUID-like pattern, extract it
  const uuidPattern =
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
  const match = slug.match(uuidPattern);
  if (match) return match[1];

  // If slug ends with short ID (8 chars), we can't reconstruct full ID
  // So we'll need to search by slugified title
  return null;
}
