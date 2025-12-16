import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  and,
  asc,
  categories,
  db,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  productImages,
  products,
  productVariants,
  sql,
} from "@vcecom/db";
import Fuse from "fuse.js";
import {
  calculateGstAmount,
  calculatePriceWithGst,
  isValidGstRate,
} from "../../common/utils/gst.utils";
import {
  generatePaginationMetadata,
  normalizePaginationParams,
} from "../../common/utils/pagination.utils";
import {
  calculateRelevanceScore,
  isLikelySku,
  parseSearchQuery,
} from "../../common/utils/search.utils";
import { StorageService } from "../storage/storage.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { FilterProductsDto, SortField, SortOrder } from "./dto/filter.dto";
import { QueryProductsDto } from "./dto/query-products.dto";
import {
  SearchProductsDto,
  SearchResponseDto,
  SearchResultDto,
  SearchSortBy,
} from "./dto/search.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly storageService: StorageService) {}
  /**
   * Create a new product
   */
  async create(createProductDto: CreateProductDto) {
    // Validate category exists if provided
    if (createProductDto.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, createProductDto.categoryId))
        .limit(1);

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${createProductDto.categoryId} not found`,
        );
      }
    }

    // Validate GST rate
    const gstRate = createProductDto.gstRate ?? 0;
    if (!isValidGstRate(gstRate)) {
      throw new BadRequestException(
        `Invalid GST rate. Valid rates are: 0%, 5%, 12%, 18%, 28%`,
      );
    }

    // Create product
    const [newProduct] = await db
      .insert(products)
      .values({
        title: createProductDto.title,
        description: createProductDto.description || null,
        price: createProductDto.price,
        gstRate,
        hsnCode: createProductDto.hsnCode || null,
        status: createProductDto.status || "draft",
        categoryId: createProductDto.categoryId || null,
      })
      .returning();

    return this.enrichProductWithGst(newProduct);
  }

  /**
   * Get all products with pagination, search, and filters
   */
  async findAll(query: QueryProductsDto) {
    const { page, limit, offset } = normalizePaginationParams(
      query.page,
      query.limit,
    );

    // Build where conditions array
    const conditions: ReturnType<
      | typeof eq
      | typeof and
      | typeof or
      | typeof gte
      | typeof lte
      | typeof ilike
    >[] = [];

    // Search condition (title, description, or SKU)
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const searchConditions = [
        ilike(products.title, searchPattern),
        ilike(products.description, searchPattern),
      ];

      // Search in variants SKU if search term looks like SKU
      if (query.search.length <= 50) {
        // Get product IDs that have matching SKUs
        const variantsWithMatchingSku = await db
          .select({ productId: productVariants.productId })
          .from(productVariants)
          .where(ilike(productVariants.sku, searchPattern));

        if (variantsWithMatchingSku.length > 0) {
          const productIds = variantsWithMatchingSku.map((v) => v.productId);
          const { inArray } = await import("@vcecom/db");
          searchConditions.push(inArray(products.id, productIds));
        }
      }

      conditions.push(or(...searchConditions));
    }

    // Status filter
    if (query.status) {
      conditions.push(eq(products.status, query.status));
    }

    // Category filter
    if (query.categoryId) {
      conditions.push(eq(products.categoryId, query.categoryId));
    }

    // Price range filters
    if (query.minPrice !== undefined) {
      conditions.push(gte(products.price, query.minPrice));
    }
    if (query.maxPrice !== undefined) {
      conditions.push(lte(products.price, query.maxPrice));
    }

    // Availability filter (in stock/out of stock)
    if (query.inStock !== undefined) {
      // Get products with at least one variant with inventory > 0
      const productsInStock = await db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .where(sql`${productVariants.inventory} > 0`);

      // Get unique product IDs
      const productIdsInStock = Array.from(
        new Set(productsInStock.map((p) => p.productId)),
      );

      if (query.inStock) {
        // Filter to only products in stock
        if (productIdsInStock.length > 0) {
          const { inArray } = await import("@vcecom/db");
          conditions.push(inArray(products.id, productIdsInStock));
        } else {
          // No products in stock, return empty result
          const pagination = generatePaginationMetadata(0, page, limit);
          return {
            data: [],
            total: pagination.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: pagination.totalPages,
            hasNextPage: pagination.hasNextPage,
            hasPreviousPage: pagination.hasPreviousPage,
          };
        }
      } else {
        // Filter to only products out of stock (not in the in-stock list)
        if (productIdsInStock.length > 0) {
          const { notInArray } = await import("@vcecom/db");
          conditions.push(notInArray(products.id, productIdsInStock));
        }
        // If no products are in stock, all products are out of stock, so no additional filter needed
      }
    }

    // Build final where condition
    let whereCondition: ReturnType<typeof and> | undefined;
    if (conditions.length > 0) {
      whereCondition = and(...conditions);
    }

    // Get total count
    const countQuery = db.select().from(products);
    if (whereCondition) {
      countQuery.where(whereCondition);
    }
    const allProductsForCount = await countQuery;
    const total = allProductsForCount.length;

    // Build sort order
    const sortBy = query.sortBy || "date";
    const sortOrder = query.sortOrder || "desc";
    let orderBy: ReturnType<typeof asc> | ReturnType<typeof desc>;
    if (sortBy === "price") {
      orderBy =
        sortOrder === "asc" ? asc(products.price) : desc(products.price);
    } else if (sortBy === "name") {
      orderBy =
        sortOrder === "asc" ? asc(products.title) : desc(products.title);
    } else {
      // date (default)
      orderBy =
        sortOrder === "asc"
          ? asc(products.createdAt)
          : desc(products.createdAt);
    }

    // Get products
    const productsQuery = db.select().from(products);
    if (whereCondition) {
      productsQuery.where(whereCondition);
    }
    const allProducts = await productsQuery
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const pagination = generatePaginationMetadata(Number(total), page, limit);

    return {
      data: allProducts.map((product) => this.enrichProductWithGst(product)),
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage,
    };
  }

  /**
   * Filter products with advanced filtering and sorting options
   * Supports filtering by category, price range, availability, and status
   * Supports sorting by price, name, or date
   */
  async filter(filterDto: FilterProductsDto) {
    const { page, limit, offset } = normalizePaginationParams(
      filterDto.page,
      filterDto.limit,
    );

    // Build where conditions array
    const conditions: ReturnType<
      typeof eq | typeof and | typeof gte | typeof lte | typeof inArray
    >[] = [];

    // Status filter
    if (filterDto.status) {
      conditions.push(eq(products.status, filterDto.status));
    }

    // Category filter
    if (filterDto.categoryId) {
      conditions.push(eq(products.categoryId, filterDto.categoryId));
    }

    // Price range filters
    if (filterDto.minPrice !== undefined) {
      conditions.push(gte(products.price, filterDto.minPrice));
    }
    if (filterDto.maxPrice !== undefined) {
      conditions.push(lte(products.price, filterDto.maxPrice));
    }

    // Availability filter (in stock/out of stock)
    if (filterDto.inStock !== undefined) {
      // Get products with at least one variant with inventory > 0
      const productsInStock = await db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .where(sql`${productVariants.inventory} > 0`);

      // Get unique product IDs
      const productIdsInStock = Array.from(
        new Set(productsInStock.map((p) => p.productId)),
      );

      if (filterDto.inStock) {
        // Filter to only products in stock
        if (productIdsInStock.length > 0) {
          conditions.push(inArray(products.id, productIdsInStock));
        } else {
          // No products in stock, return empty result
          const pagination = generatePaginationMetadata(0, page, limit);
          return {
            data: [],
            total: pagination.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: pagination.totalPages,
            hasNextPage: pagination.hasNextPage,
            hasPreviousPage: pagination.hasPreviousPage,
          };
        }
      } else {
        // Filter to only products out of stock (not in the in-stock list)
        if (productIdsInStock.length > 0) {
          const { notInArray } = await import("@vcecom/db");
          conditions.push(notInArray(products.id, productIdsInStock));
        }
        // If no products are in stock, all products are out of stock, so no additional filter needed
      }
    }

    // Build final where condition
    let whereCondition: ReturnType<typeof and> | undefined;
    if (conditions.length > 0) {
      whereCondition = and(...conditions);
    }

    // Get total count
    const countQuery = db.select().from(products);
    if (whereCondition) {
      countQuery.where(whereCondition);
    }
    const allProductsForCount = await countQuery;
    const total = allProductsForCount.length;

    // Build sort order
    const sortBy = filterDto.sortBy || SortField.DATE;
    const sortOrder = filterDto.sortOrder || SortOrder.DESC;
    let orderBy: ReturnType<typeof asc> | ReturnType<typeof desc>;
    if (sortBy === SortField.PRICE) {
      orderBy =
        sortOrder === SortOrder.ASC
          ? asc(products.price)
          : desc(products.price);
    } else if (sortBy === SortField.NAME) {
      orderBy =
        sortOrder === SortOrder.ASC
          ? asc(products.title)
          : desc(products.title);
    } else {
      // DATE (default)
      orderBy =
        sortOrder === SortOrder.ASC
          ? asc(products.createdAt)
          : desc(products.createdAt);
    }

    // Get products
    const productsQuery = db.select().from(products);
    if (whereCondition) {
      productsQuery.where(whereCondition);
    }
    const allProducts = await productsQuery
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const pagination = generatePaginationMetadata(Number(total), page, limit);

    return {
      data: allProducts.map((product) => this.enrichProductWithGst(product)),
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage,
    };
  }

  /**
   * Get product by ID
   */
  async findOne(id: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.enrichProductWithGst(product);
  }

  /**
   * Update a product
   */
  async update(id: string, updateProductDto: UpdateProductDto) {
    // Check if product exists
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Validate category exists if provided
    if (updateProductDto.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, updateProductDto.categoryId))
        .limit(1);

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${updateProductDto.categoryId} not found`,
        );
      }
    }

    // Build update data
    const updateData: Partial<typeof products.$inferInsert> = {};
    if (updateProductDto.title !== undefined)
      updateData.title = updateProductDto.title;
    if (updateProductDto.description !== undefined)
      updateData.description = updateProductDto.description || null;
    if (updateProductDto.price !== undefined)
      updateData.price = updateProductDto.price;
    if (updateProductDto.gstRate !== undefined)
      updateData.gstRate = updateProductDto.gstRate;
    if (updateProductDto.status !== undefined)
      updateData.status = updateProductDto.status;
    if (updateProductDto.categoryId !== undefined)
      updateData.categoryId = updateProductDto.categoryId || null;

    // Update product
    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return this.enrichProductWithGst(updated);
  }

  /**
   * Delete a product
   */
  async remove(id: string) {
    // Check if product exists
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Delete product (variants and images will be cascade deleted)
    await db.delete(products).where(eq(products.id, id));

    return { message: "Product deleted successfully" };
  }

  /**
   * Advanced product search with full-text search, SKU search, and ranking
   * Uses fuse.js for fuzzy search and relevance scoring
   */
  async search(searchDto: SearchProductsDto): Promise<SearchResponseDto> {
    const { page, limit, offset } = normalizePaginationParams(
      searchDto.page,
      searchDto.limit,
    );

    // Parse search query
    const parsedQuery = parseSearchQuery(searchDto.query);

    // Build base conditions
    const conditions: ReturnType<
      | typeof eq
      | typeof and
      | typeof or
      | typeof gte
      | typeof lte
      | typeof inArray
    >[] = [];

    // Only search active products
    conditions.push(eq(products.status, "active"));

    // Category filter
    if (searchDto.categoryId) {
      conditions.push(eq(products.categoryId, searchDto.categoryId));
    }

    // Price range filters
    if (searchDto.minPrice !== undefined) {
      conditions.push(gte(products.price, searchDto.minPrice));
    }
    if (searchDto.maxPrice !== undefined) {
      conditions.push(lte(products.price, searchDto.maxPrice));
    }

    // Availability filter
    if (searchDto.inStock !== undefined) {
      const productsInStock = await db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .where(sql`${productVariants.inventory} > 0`);

      // Get unique product IDs
      const productIdsInStock = Array.from(
        new Set(productsInStock.map((p) => p.productId)),
      );

      if (searchDto.inStock) {
        if (productIdsInStock.length > 0) {
          conditions.push(inArray(products.id, productIdsInStock));
        } else {
          // No products in stock
          const pagination = generatePaginationMetadata(0, page, limit);
          return {
            results: [],
            total: pagination.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: pagination.totalPages,
            hasNextPage: pagination.hasNextPage,
            hasPreviousPage: pagination.hasPreviousPage,
            query: searchDto.query,
          };
        }
      } else if (productIdsInStock.length > 0) {
        const { notInArray } = await import("@vcecom/db");
        conditions.push(notInArray(products.id, productIdsInStock));
      }
    }

    // Build where condition
    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Get all matching products (we'll filter and rank in memory for better relevance)
    const allProducts = await db
      .select({
        id: products.id,
        title: products.title,
        description: products.description,
        price: products.price,
        gstRate: products.gstRate,
        hsnCode: products.hsnCode,
        status: products.status,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(whereCondition);

    // Search in SKUs if query looks like SKU or contains SKU-like terms
    const isSkuSearch = isLikelySku(searchDto.query);
    const skuMatches = new Map<string, string>(); // productId -> matching SKU

    if (isSkuSearch || parsedQuery.keywords.some((k) => isLikelySku(k))) {
      const searchPatterns = parsedQuery.keywords
        .filter((k) => isLikelySku(k))
        .map((k) => `%${k}%`);

      if (searchPatterns.length > 0 || isSkuSearch) {
        const skuSearchPattern = isSkuSearch
          ? `%${searchDto.query}%`
          : searchPatterns[0];

        const variantsWithMatchingSku = await db
          .select({
            productId: productVariants.productId,
            sku: productVariants.sku,
          })
          .from(productVariants)
          .where(ilike(productVariants.sku, skuSearchPattern));

        variantsWithMatchingSku.forEach((v) => {
          if (!skuMatches.has(v.productId)) {
            skuMatches.set(v.productId, v.sku);
          }
        });
      }
    }

    // Add products found via SKU search
    if (skuMatches.size > 0) {
      const skuProductIds = Array.from(skuMatches.keys());
      const skuProducts = await db
        .select({
          id: products.id,
          title: products.title,
          description: products.description,
          price: products.price,
          gstRate: products.gstRate,
          hsnCode: products.hsnCode,
          status: products.status,
          categoryId: products.categoryId,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .where(
          and(
            eq(products.status, "active"),
            inArray(products.id, skuProductIds),
          ),
        );

      // Merge with existing products, avoiding duplicates
      const existingIds = new Set(allProducts.map((p) => p.id));
      skuProducts.forEach((p) => {
        if (!existingIds.has(p.id)) {
          allProducts.push(p);
        }
      });
    }

    // Filter out invalid products before search
    const validProducts = allProducts.filter(
      (p) => p?.title && typeof p.title === "string",
    );

    // Use Fuse.js for fuzzy search and ranking
    const fuse = new Fuse(validProducts, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "description", weight: 0.3 },
      ],
      threshold: 0.4, // Lower = more strict matching
      includeScore: true,
      minMatchCharLength: 2,
    });

    // Perform search
    const fuseResults = fuse.search(searchDto.query);

    // Map results with relevance scores
    const resultsWithScores: Array<{
      product: (typeof allProducts)[0];
      relevanceScore: number;
      matchingSku?: string | null;
    }> = fuseResults
      .filter((result) => result.item?.title)
      .map((result) => {
        const product = result.item;
        const fuseScore = result.score || 1.0; // Lower score = better match in Fuse.js
        const customScore = calculateRelevanceScore(
          product,
          searchDto.query,
          parsedQuery,
          skuMatches.get(product.id),
        );

        // Combine Fuse.js score (inverted) with custom relevance score
        // Fuse.js score is 0-1 where 0 is perfect match
        // Custom score is 0-1 where 1 is perfect match
        const combinedScore = (1 - fuseScore) * 0.6 + customScore * 0.4;

        return {
          product,
          relevanceScore: Math.min(1.0, combinedScore),
          matchingSku: skuMatches.get(product.id) || null,
        };
      });

    // If no Fuse.js results but we have products (e.g., SKU match), include them
    // Only include products that have SKU matches or some text relevance
    if (fuseResults.length === 0 && validProducts.length > 0) {
      validProducts.forEach((product) => {
        // Ensure product has required fields
        if (!product || !product.title) {
          return;
        }

        const matchingSku = skuMatches.get(product.id);
        if (matchingSku) {
          // SKU match gets high relevance
          resultsWithScores.push({
            product,
            relevanceScore: 0.9,
            matchingSku,
          });
        } else {
          // Only include if there's some text match
          // Check if query appears in title or description
          const queryLower = searchDto.query.toLowerCase();
          const titleLower = product.title.toLowerCase();
          const descriptionLower = (product.description || "").toLowerCase();

          if (
            titleLower.includes(queryLower) ||
            descriptionLower.includes(queryLower)
          ) {
            const score = calculateRelevanceScore(
              product,
              searchDto.query,
              parsedQuery,
            );
            if (score > 0) {
              resultsWithScores.push({
                product,
                relevanceScore: score,
                matchingSku: null,
              });
            }
          }
        }
      });
    }

    // Sort by relevance or other criteria
    if (searchDto.sortBy === SearchSortBy.RELEVANCE) {
      resultsWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (searchDto.sortBy === SearchSortBy.PRICE) {
      resultsWithScores.sort((a, b) => {
        const priceDiff = a.product.price - b.product.price;
        return searchDto.sortOrder === "asc" ? priceDiff : -priceDiff;
      });
    } else if (searchDto.sortBy === SearchSortBy.NAME) {
      resultsWithScores.sort((a, b) => {
        const nameDiff = a.product.title.localeCompare(b.product.title);
        return searchDto.sortOrder === "asc" ? nameDiff : -nameDiff;
      });
    } else {
      // DATE
      resultsWithScores.sort((a, b) => {
        const dateDiff =
          a.product.createdAt.getTime() - b.product.createdAt.getTime();
        return searchDto.sortOrder === "asc" ? dateDiff : -dateDiff;
      });
    }

    // Paginate
    const total = resultsWithScores.length;
    const paginatedResults = resultsWithScores.slice(offset, offset + limit);

    // Map to response DTO
    const searchResults: SearchResultDto[] = paginatedResults.map((item) => ({
      id: item.product.id,
      title: item.product.title,
      description: item.product.description,
      price: Number(item.product.price),
      relevanceScore: Number(item.relevanceScore.toFixed(4)),
      matchingSku: item.matchingSku,
    }));

    const pagination = generatePaginationMetadata(total, page, limit);

    return {
      results: searchResults,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage,
      query: searchDto.query,
    };
  }

  /**
   * Enrich product with GST calculations
   * @param product - Product from database
   * @returns Product with GST calculations added
   */
  private enrichProductWithGst(product: typeof products.$inferSelect) {
    const gstAmount = calculateGstAmount(product.price, product.gstRate);
    const priceIncludingGst = calculatePriceWithGst(
      product.price,
      product.gstRate,
    );

    return {
      ...product,
      gstAmount: Number(gstAmount.toFixed(2)),
      priceExcludingGst: Number(product.price.toFixed(2)),
      priceIncludingGst: Number(priceIncludingGst.toFixed(2)),
      hsnCode: product.hsnCode || null,
    };
  }

  /**
   * Check if a URL is an S3 key (stored in our storage)
   * S3 keys typically start with a prefix like "products/", "avatars/", etc.
   */
  private isS3Key(url: string): boolean {
    // Check if it looks like an S3 key (has prefix pattern, no http/https)
    return (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      url.includes("/")
    );
  }

  /**
   * Get product images with resolved URLs
   * Converts S3 keys to public URLs, keeps existing URLs as-is
   */
  async getProductImages(productId: string) {
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.order));

    // Resolve S3 keys to URLs
    const resolvedImages = await Promise.all(
      images.map(async (image) => {
        let url = image.url;
        if (this.isS3Key(image.url)) {
          try {
            url = await this.storageService.getUrl(image.url);
          } catch {
            // If S3 key resolution fails, keep original
            url = image.url;
          }
        }
        return {
          ...image,
          url,
        };
      }),
    );

    return resolvedImages;
  }

  /**
   * Add an image to a product
   * @param productId - Product ID
   * @param imageKey - S3 key or URL
   * @param altText - Alt text for the image
   * @param order - Display order
   * @param variantId - Optional variant ID
   */
  async addProductImage(
    productId: string,
    imageKey: string,
    altText?: string,
    order = 0,
    variantId?: string,
  ) {
    // Validate product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Validate variant exists if provided
    if (variantId) {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      if (!variant) {
        throw new NotFoundException(`Variant with ID ${variantId} not found`);
      }
    }

    const [newImage] = await db
      .insert(productImages)
      .values({
        productId,
        variantId: variantId || null,
        url: imageKey, // Store S3 key or URL
        altText: altText || null,
        order,
      })
      .returning();

    // Resolve URL if it's an S3 key
    let url = imageKey;
    if (this.isS3Key(imageKey)) {
      try {
        url = await this.storageService.getUrl(imageKey);
      } catch {
        url = imageKey;
      }
    }

    return {
      ...newImage,
      url,
    };
  }

  /**
   * Delete a product image
   * Also deletes from S3 if it's an S3 key
   */
  async deleteProductImage(imageId: string) {
    const [image] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.id, imageId))
      .limit(1);

    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }

    // Delete from S3 if it's an S3 key
    if (this.isS3Key(image.url)) {
      try {
        await this.storageService.delete(image.url);
      } catch {
        // Continue even if S3 deletion fails
      }
    }

    // Delete from database
    await db.delete(productImages).where(eq(productImages.id, imageId));

    return { message: "Image deleted successfully" };
  }

  /**
   * Update product image order
   */
  async updateImageOrder(imageId: string, order: number) {
    const [image] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.id, imageId))
      .limit(1);

    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }

    const [updated] = await db
      .update(productImages)
      .set({ order, updatedAt: new Date() })
      .where(eq(productImages.id, imageId))
      .returning();

    return updated;
  }
}
