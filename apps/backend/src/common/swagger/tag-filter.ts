import { OpenAPIObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

/**
 * Swagger document filter that ensures only "admin" and "store" tags are present
 * Completely rebuilds the tags array and aggressively filters operation tags
 */
export function filterSwaggerTags(document: OpenAPIObject): OpenAPIObject {
  const allowedTags = new Set(["admin", "store"]);

  // Completely rebuild tags array with only allowed tags
  document.tags = [
    { name: "admin", description: "Admin dashboard endpoints" },
    { name: "store", description: "Storefront API endpoints" },
  ];

  // Collect all unique tags used in operations
  const usedTags = new Set<string>();

  // Filter tags from all paths and operations
  if (document.paths) {
    Object.keys(document.paths).forEach((path) => {
      const pathItem = document.paths[path];
      if (pathItem) {
        Object.keys(pathItem).forEach((method) => {
          const operation = pathItem[method as keyof typeof pathItem];
          if (
            operation &&
            typeof operation === "object" &&
            "tags" in operation
          ) {
            if (Array.isArray(operation.tags)) {
              // Filter to only allowed tags
              operation.tags = operation.tags.filter((tag) =>
                allowedTags.has(tag),
              );

              // If no tags remain or tags are invalid, assign based on path prefix
              if (operation.tags.length === 0) {
                if (path.startsWith("/admin") || path.startsWith("/_health")) {
                  operation.tags = ["admin"];
                } else if (path.startsWith("/store")) {
                  operation.tags = ["store"];
                } else {
                  // Default to admin for root and other endpoints
                  operation.tags = ["admin"];
                }
              }

              // Track which tags are actually used
              operation.tags.forEach((tag) => {
                if (allowedTags.has(tag)) {
                  usedTags.add(tag);
                }
              });
            } else if (!operation.tags) {
              // If tags property doesn't exist, assign based on path
              if (path.startsWith("/admin") || path.startsWith("/_health")) {
                operation.tags = ["admin"];
                usedTags.add("admin");
              } else if (path.startsWith("/store")) {
                operation.tags = ["store"];
                usedTags.add("store");
              } else {
                operation.tags = ["admin"];
                usedTags.add("admin");
              }
            }
          }
        });
      }
    });
  }

  // Always keep both tags, even if one isn't used (for consistent UI)
  // The tags array is already set to only contain "admin" and "store" above
  // No need to filter further - we want both tags to always appear

  return document;
}
