import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  and,
  collections,
  db,
  eq,
  ilike,
  inArray,
  or,
  productCollections,
  products,
  sql,
} from "@vcecom/db";
import {
  generatePaginationMetadata,
  normalizePaginationParams,
} from "../../common/utils/pagination.utils";
import { AddProductsDto } from "./dto/add-products.dto";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { QueryCollectionsDto } from "./dto/query-collections.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

@Injectable()
export class CollectionsService {
  /**
   * Generate a slug from a name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Ensure slug is unique by appending a number if needed
   */
  private async ensureUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const [existing] = await db
        .select()
        .from(collections)
        .where(eq(collections.slug, slug))
        .limit(1);

      if (!existing || existing.id === excludeId) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Create a new collection
   */
  async create(createCollectionDto: CreateCollectionDto) {
    // Generate slug if not provided
    const slug = createCollectionDto.slug
      ? await this.ensureUniqueSlug(createCollectionDto.slug)
      : await this.ensureUniqueSlug(
          this.generateSlug(createCollectionDto.name),
        );

    // Create collection
    const [newCollection] = await db
      .insert(collections)
      .values({
        name: createCollectionDto.name,
        slug,
        description: createCollectionDto.description || null,
        imageUrl: createCollectionDto.imageUrl || null,
      })
      .returning();

    return newCollection;
  }

  /**
   * Get all collections with pagination and search
   */
  async findAll(query: QueryCollectionsDto) {
    const { page, limit, offset } = normalizePaginationParams(
      query.page,
      query.limit,
    );

    // Build where conditions
    const conditions: ReturnType<typeof or | typeof and>[] = [];
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const searchCondition = or(
        ilike(collections.name, searchPattern),
        ilike(collections.description, searchPattern),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Get total count
    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(collections)
      .where(whereCondition);

    const total = Number(totalResult[0]?.count || 0);

    if (total === 0) {
      const pagination = generatePaginationMetadata(0, page, limit);
      return {
        data: [],
        pagination,
      };
    }

    // Get collections with product count
    const collectionsData = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        imageUrl: collections.imageUrl,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        productCount: sql<number>`count(${productCollections.id})`.as(
          "product_count",
        ),
      })
      .from(collections)
      .leftJoin(
        productCollections,
        eq(collections.id, productCollections.collectionId),
      )
      .where(whereCondition)
      .groupBy(collections.id)
      .orderBy(collections.createdAt)
      .limit(limit)
      .offset(offset);

    const pagination = generatePaginationMetadata(total, page, limit);

    return {
      data: collectionsData.map((c) => ({
        ...c,
        productCount: Number(c.productCount) || 0,
      })),
      pagination,
    };
  }

  /**
   * Get collection by ID
   */
  async findOne(id: string) {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    // Get product count
    const productCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(productCollections)
      .where(eq(productCollections.collectionId, id));

    const productCount = Number(productCountResult[0]?.count || 0);

    return {
      ...collection,
      productCount,
    };
  }

  /**
   * Get collection by slug
   */
  async findBySlug(slug: string) {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);

    if (!collection) {
      throw new NotFoundException(`Collection with slug '${slug}' not found`);
    }

    // Get product count
    const productCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(productCollections)
      .where(eq(productCollections.collectionId, collection.id));

    const productCount = Number(productCountResult[0]?.count || 0);

    return {
      ...collection,
      productCount,
    };
  }

  /**
   * Update a collection
   */
  async update(id: string, updateCollectionDto: UpdateCollectionDto) {
    // Check if collection exists
    const [existing] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    // Generate slug if name changed and slug not provided
    let slug = updateCollectionDto.slug;
    if (updateCollectionDto.name && !slug) {
      slug = await this.ensureUniqueSlug(
        this.generateSlug(updateCollectionDto.name),
        id,
      );
    } else if (slug) {
      slug = await this.ensureUniqueSlug(slug, id);
    }

    // Update collection
    const updateData: Partial<typeof collections.$inferInsert> = {};
    if (updateCollectionDto.name !== undefined)
      updateData.name = updateCollectionDto.name;
    if (slug !== undefined) updateData.slug = slug;
    if (updateCollectionDto.description !== undefined)
      updateData.description = updateCollectionDto.description || null;
    if (updateCollectionDto.imageUrl !== undefined)
      updateData.imageUrl = updateCollectionDto.imageUrl || null;

    const [updated] = await db
      .update(collections)
      .set(updateData)
      .where(eq(collections.id, id))
      .returning();

    return updated;
  }

  /**
   * Delete a collection
   */
  async remove(id: string) {
    // Check if collection exists
    const [existing] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    // Delete collection (cascade will remove product associations)
    await db.delete(collections).where(eq(collections.id, id));

    return { message: "Collection deleted successfully" };
  }

  /**
   * Get products in a collection
   */
  async getProducts(collectionId: string) {
    // Check if collection exists
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (!collection) {
      throw new NotFoundException(
        `Collection with ID ${collectionId} not found`,
      );
    }

    // Get products in collection
    const collectionProducts = await db
      .select({
        id: products.id,
        title: products.title,
        price: products.price,
        status: products.status,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(eq(productCollections.collectionId, collectionId))
      .orderBy(products.createdAt);

    return collectionProducts;
  }

  /**
   * Add products to a collection
   */
  async addProducts(collectionId: string, addProductsDto: AddProductsDto) {
    // Check if collection exists
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (!collection) {
      throw new NotFoundException(
        `Collection with ID ${collectionId} not found`,
      );
    }

    // Validate all products exist
    const existingProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, addProductsDto.productIds));

    const existingProductIds = new Set(existingProducts.map((p) => p.id));
    const missingProductIds = addProductsDto.productIds.filter(
      (id) => !existingProductIds.has(id),
    );

    if (missingProductIds.length > 0) {
      throw new BadRequestException(
        `Products not found: ${missingProductIds.join(", ")}`,
      );
    }

    // Check which products are already in collection
    const existingAssociations = await db
      .select({ productId: productCollections.productId })
      .from(productCollections)
      .where(eq(productCollections.collectionId, collectionId));

    const existingAssociationIds = new Set(
      existingAssociations.map((a) => a.productId),
    );

    // Filter out products already in collection
    const newProductIds = addProductsDto.productIds.filter(
      (id) => !existingAssociationIds.has(id),
    );

    if (newProductIds.length === 0) {
      return {
        message: "All products are already in the collection",
        added: 0,
        skipped: addProductsDto.productIds.length,
      };
    }

    // Add products to collection
    await db.insert(productCollections).values(
      newProductIds.map((productId) => ({
        collectionId,
        productId,
      })),
    );

    return {
      message: `Added ${newProductIds.length} product(s) to collection`,
      added: newProductIds.length,
      skipped: addProductsDto.productIds.length - newProductIds.length,
    };
  }

  /**
   * Remove a product from a collection
   */
  async removeProduct(collectionId: string, productId: string) {
    // Check if collection exists
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (!collection) {
      throw new NotFoundException(
        `Collection with ID ${collectionId} not found`,
      );
    }

    // Check if product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Remove product from collection
    await db
      .delete(productCollections)
      .where(
        sql`${productCollections.collectionId} = ${collectionId} AND ${productCollections.productId} = ${productId}`,
      );

    return { message: "Product removed from collection successfully" };
  }
}
