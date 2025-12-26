#!/usr/bin/env tsx
/**
 * VCEcom Bulk Operations Script
 * 
 * Performs bulk operations on VCEcom instance:
 * 1. Makes all products tax-inclusive
 * 2. Deletes all existing bundles
 * 3. Creates "Pick Any Pack" bundles for T-shirts
 */

import { randomUUID } from "crypto";

// Configuration
const API_BASE_URL = "https://vestcodesvcecom-backend-production.up.railway.app";
const ADMIN_EMAIL = "admin@vcecom.local";
const ADMIN_PASSWORD = "Admin@123";

// Types
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  id: string;
  email: string;
  role: string;
  requires2fa?: boolean;
}

interface Product {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  gstRate: number;
  pricingType: "inclusive" | "exclusive";
  status: "draft" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

interface PaginatedProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Variant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  inventory: number;
  size?: string | null;
  color?: string | null;
}

interface Bundle {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  allowMixAndMatch: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedBundlesResponse {
  data: Bundle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BundleResponse {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  allowMixAndMatch: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BundleSetResponse {
  id: string;
  message: string;
}

interface BundleSetItemResponse {
  id: string;
  message: string;
}

// API Client
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available. Please login again.");
    }

    // If already refreshing, wait for that promise
    if (this.isRefreshing && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    // Start refresh process
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        // Send refresh token as cookie header (backend expects it from cookies)
        const response = await fetch(`${this.baseUrl}/admin/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `admin_refresh_token=${this.refreshToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Token refresh failed: ${errorText} (${response.status})`,
          );
        }

        const data = await response.json();
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;

        console.log("  🔄 Access token refreshed");
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    await this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOn401 = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401 && retryOn401 && this.refreshToken) {
      console.log(`  ⚠️  Access token expired, refreshing...`);
      try {
        await this.refreshAccessToken();
        // Retry the request once with new token
        return this.request<T>(endpoint, options, false);
      } catch (refreshError) {
        throw new Error(
          `Authentication failed: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`,
        );
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`${errorMessage} (${response.status})`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    return undefined as T;
  }

  async login(email: string, password: string): Promise<void> {
    const deviceId = randomUUID();
    const response = await this.request<LoginResponse>(
      "/admin/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          deviceId,
        }),
      },
    );

    if (response.requires2fa) {
      throw new Error("2FA is required but not supported in this script");
    }

    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    console.log(`✓ Authenticated as ${response.email} (${response.role})`);
  }

  async getAllProducts(): Promise<Product[]> {
    const allProducts: Product[] = [];
    let page = 1;
    const limit = 100;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await this.request<PaginatedProductsResponse>(
        `/store/products?page=${page}&limit=${limit}`,
      );

      allProducts.push(...response.data);
      hasNextPage = response.hasNextPage;
      page++;

      console.log(
        `  Fetched page ${response.page}/${response.totalPages} (${allProducts.length}/${response.total} products)`,
      );
    }

    return allProducts;
  }

  async updateProduct(
    productId: string,
    updateData: { pricingType: "inclusive" },
  ): Promise<Product> {
    return this.request<Product>(`/admin/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async getAllBundles(): Promise<Bundle[]> {
    const allBundles: Bundle[] = [];
    let page = 1;
    const limit = 100;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await this.request<PaginatedBundlesResponse>(
        `/admin/bundles?page=${page}&limit=${limit}`,
      );

      allBundles.push(...response.data);
      hasNextPage = response.hasNextPage;
      page++;

      console.log(
        `  Fetched page ${response.page}/${response.totalPages} (${allBundles.length}/${response.total} bundles)`,
      );
    }

    return allBundles;
  }

  async deleteBundle(bundleId: string): Promise<void> {
    await this.request(`/admin/bundles/${bundleId}`, {
      method: "DELETE",
    });
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const allProducts: Product[] = [];
    let page = 1;
    const limit = 100;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await this.request<PaginatedProductsResponse>(
        `/store/products?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`,
      );

      allProducts.push(...response.data);
      hasNextPage = response.hasNextPage;
      page++;
    }

    return allProducts;
  }

  async getProductVariants(productId: string): Promise<Variant[]> {
    return this.request<Variant[]>(`/store/products/${productId}/variants`);
  }

  async createBundle(data: {
    title: string;
    description?: string;
    isActive?: boolean;
    allowMixAndMatch?: boolean;
  }): Promise<BundleResponse> {
    return this.request<BundleResponse>("/admin/bundles", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        isActive: data.isActive ?? true,
        allowMixAndMatch: data.allowMixAndMatch ?? true,
      }),
    });
  }

  async createBundleSet(
    bundleId: string,
    data: {
      title: string;
      description?: string;
      minQuantity: number;
      maxQuantity: number;
    },
  ): Promise<BundleSetResponse> {
    return this.request<BundleSetResponse>(
      `/admin/bundles/${bundleId}/sets`,
      {
        method: "POST",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          minQuantity: data.minQuantity,
          maxQuantity: data.maxQuantity,
        }),
      },
    );
  }

  async addBundleSetItem(
    bundleId: string,
    setId: string,
    variantId: string,
  ): Promise<BundleSetItemResponse> {
    return this.request<BundleSetItemResponse>(
      `/admin/bundles/${bundleId}/sets/${setId}/items`,
      {
        method: "POST",
        body: JSON.stringify({
          variantId,
        }),
      },
    );
  }
}

// Main execution
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apiClient = new ApiClient(API_BASE_URL);

  console.log("🚀 VCEcom Bulk Operations Script");
  console.log("==================================\n");

  if (dryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  try {
    // Step 1: Authenticate
    console.log("Step 1: Authenticating...");
    await apiClient.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log();

    // Step 2: Make all products tax-inclusive
    console.log("Step 2: Updating products to tax-inclusive...");
    const allProducts = await apiClient.getAllProducts();
    const productsToUpdate = allProducts.filter(
      (p) => p.pricingType !== "inclusive",
    );

    console.log(
      `Found ${productsToUpdate.length} products with exclusive pricing out of ${allProducts.length} total`,
    );

    if (!dryRun) {
      let updated = 0;
      let failed = 0;

      for (const product of productsToUpdate) {
        try {
          await apiClient.updateProduct(product.id, {
            pricingType: "inclusive",
          });
          updated++;
          console.log(`  ✓ Updated: ${product.title}`);
        } catch (error) {
          failed++;
          console.error(
            `  ✗ Failed to update ${product.title}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      console.log(
        `\n✓ Updated ${updated} products, ${failed} failed\n`,
      );
    } else {
      console.log(`Would update ${productsToUpdate.length} products:\n`);
      productsToUpdate.slice(0, 10).forEach((p) => {
        console.log(`  - ${p.title} (${p.id})`);
      });
      if (productsToUpdate.length > 10) {
        console.log(`  ... and ${productsToUpdate.length - 10} more`);
      }
      console.log();
    }

    // Step 3: Delete all bundles
    console.log("Step 3: Deleting all existing bundles...");
    const existingBundles = await apiClient.getAllBundles();
    console.log(`Found ${existingBundles.length} existing bundles`);

    if (!dryRun) {
      let deleted = 0;
      let failed = 0;

      for (const bundle of existingBundles) {
        try {
          await apiClient.deleteBundle(bundle.id);
          deleted++;
          console.log(`  ✓ Deleted: ${bundle.title}`);
        } catch (error) {
          failed++;
          console.error(
            `  ✗ Failed to delete ${bundle.title}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      console.log(`\n✓ Deleted ${deleted} bundles, ${failed} failed\n`);
    } else {
      console.log(`Would delete ${existingBundles.length} bundles:\n`);
      existingBundles.forEach((b) => {
        console.log(`  - ${b.title} (${b.id})`);
      });
      console.log();
    }

    // Step 4: Fetch T-shirt products and variants
    console.log("Step 4: Fetching T-shirt products and variants...");
    const tshirtProducts = await apiClient.searchProducts(
      "Unisex Regular Solid T-Shirt",
    );

    // Filter products that match the pattern "Unisex Regular Solid T-Shirt - *"
    const matchingProducts = tshirtProducts.filter((p) =>
      p.title.match(/^Unisex Regular Solid T-Shirt - /i),
    );

    console.log(
      `Found ${matchingProducts.length} matching products out of ${tshirtProducts.length} search results`,
    );

    // Collect all variants
    const allVariantIds: string[] = [];
    for (const product of matchingProducts) {
      try {
        const variants = await apiClient.getProductVariants(product.id);
        variants.forEach((v) => allVariantIds.push(v.id));
        console.log(
          `  ✓ ${product.title}: ${variants.length} variant(s)`,
        );
      } catch (error) {
        console.error(
          `  ✗ Failed to fetch variants for ${product.title}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    console.log(
      `\n✓ Collected ${allVariantIds.length} total variant IDs\n`,
    );

    if (allVariantIds.length === 0) {
      console.log(
        "⚠️  No variants found. Cannot create bundles. Exiting.",
      );
      return;
    }

    // Step 5: Create bundles
    console.log("Step 5: Creating 'Pick Any Pack' bundles...");
    const bundleQuantities = [3, 4, 5, 7, 8, 9];

    if (!dryRun) {
      for (const quantity of bundleQuantities) {
        try {
          console.log(`\nCreating bundle for quantity ${quantity}...`);

          // Create bundle
          const bundle = await apiClient.createBundle({
            title: `Pick Any Pack of ${quantity}`,
            description: `Choose any ${quantity} Unisex Regular Solid T-Shirts`,
            isActive: true,
            allowMixAndMatch: true,
          });
          console.log(`  ✓ Created bundle: ${bundle.title}`);

          // Create X sets (one for each item in the pack)
          const setIds: string[] = [];
          for (let i = 1; i <= quantity; i++) {
            const set = await apiClient.createBundleSet(bundle.id, {
              title: `Choose T-Shirt ${i}`,
              description: `Select 1 t-shirt from the available options`,
              minQuantity: 1,
              maxQuantity: 1,
            });
            setIds.push(set.id);
            console.log(`  ✓ Created choice set ${i}/${quantity}: ${set.id}`);
          }

          // Add all variants to each set
          let totalAdded = 0;
          let totalFailed = 0;

          for (let setIndex = 0; setIndex < setIds.length; setIndex++) {
            const setId = setIds[setIndex];
            let added = 0;
            let failed = 0;

            for (const variantId of allVariantIds) {
              try {
                await apiClient.addBundleSetItem(bundle.id, setId, variantId);
                added++;
              } catch (error) {
                failed++;
                // Don't log every failure to avoid spam
              }
            }

            totalAdded += added;
            totalFailed += failed;
            console.log(
              `  ✓ Added ${added} variants to set ${setIndex + 1} (${failed} failed)`,
            );
          }

          console.log(
            `✓ Completed bundle: Pick Any Pack of ${quantity} (${quantity} sets, ${totalAdded} total variant additions, ${totalFailed} failed)`,
          );
        } catch (error) {
          console.error(
            `  ✗ Failed to create bundle for quantity ${quantity}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      console.log("\n✅ All operations completed successfully!");
    } else {
      console.log(`Would create ${bundleQuantities.length} bundles:\n`);
      bundleQuantities.forEach((qty) => {
        console.log(
          `  - Pick Any Pack of ${qty} (${qty} sets, each with ${allVariantIds.length} variants)`,
        );
      });
      console.log();
    }
  } catch (error) {
    console.error("\n❌ Script failed:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

