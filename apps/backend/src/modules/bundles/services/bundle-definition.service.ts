import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  asc,
  bundleSetItems,
  bundleSets,
  bundles,
  db,
  desc,
  eq,
} from "@vcecom/db";
import { BundleResponseDto } from "../dto/bundle-response.dto";
import { CreateBundleDto } from "../dto/create-bundle.dto";
import { UpdateBundleDto } from "../dto/update-bundle.dto";

@Injectable()
export class BundleDefinitionService {
  /**
   * Create a new bundle
   * Note: Bundle must have at least 1 set (enforced when sets are added)
   */
  async create(dto: CreateBundleDto): Promise<BundleResponseDto> {
    const [newBundle] = await db
      .insert(bundles)
      .values({
        title: dto.title,
        description: dto.description || null,
        isActive: dto.isActive ?? true,
        allowMixAndMatch: dto.allowMixAndMatch ?? false,
      })
      .returning();

    return this.hydrateBundle(newBundle.id);
  }

  /**
   * Get all bundles with pagination
   */
  async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100); // Max 100 per page

    const allBundles = await db
      .select()
      .from(bundles)
      .orderBy(desc(bundles.createdAt))
      .limit(maxLimit)
      .offset(offset);

    const allBundlesForCount = await db.select().from(bundles);
    const total = allBundlesForCount.length;
    const totalPages = Math.ceil(total / maxLimit);

    const hydratedBundles = await Promise.all(
      allBundles.map((bundle) => this.hydrateBundle(bundle.id)),
    );

    return {
      data: hydratedBundles,
      total,
      page,
      limit: maxLimit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Get a single bundle with all sets and items (hydrated)
   */
  async findOne(id: string): Promise<BundleResponseDto> {
    return this.hydrateBundle(id);
  }

  /**
   * Update a bundle
   */
  async update(id: string, dto: UpdateBundleDto): Promise<BundleResponseDto> {
    const [existing] = await db
      .select()
      .from(bundles)
      .where(eq(bundles.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Bundle with ID ${id} not found`);
    }

    const [updated] = await db
      .update(bundles)
      .set({
        title: dto.title ?? existing.title,
        description:
          dto.description !== undefined
            ? dto.description
            : existing.description,
        isActive: dto.isActive ?? existing.isActive,
        allowMixAndMatch: dto.allowMixAndMatch ?? existing.allowMixAndMatch,
        updatedAt: new Date(),
      })
      .where(eq(bundles.id, id))
      .returning();

    return this.hydrateBundle(updated.id);
  }

  /**
   * Delete a bundle (cascades to sets and items)
   */
  async remove(id: string): Promise<{ message: string }> {
    const [existing] = await db
      .select()
      .from(bundles)
      .where(eq(bundles.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Bundle with ID ${id} not found`);
    }

    await db.delete(bundles).where(eq(bundles.id, id));

    return { message: "Bundle deleted successfully" };
  }

  /**
   * Validate bundle has at least 1 set
   */
  async validateBundleHasSets(bundleId: string): Promise<void> {
    const sets = await db
      .select()
      .from(bundleSets)
      .where(eq(bundleSets.bundleId, bundleId));

    if (sets.length === 0) {
      throw new BadRequestException("Bundle must have at least 1 choice set");
    }
  }

  /**
   * Validate bundle has at most 15 sets
   */
  async validateBundleSetCount(bundleId: string): Promise<void> {
    const sets = await db
      .select()
      .from(bundleSets)
      .where(eq(bundleSets.bundleId, bundleId));

    if (sets.length >= 15) {
      throw new BadRequestException(
        "Bundle cannot have more than 15 choice sets",
      );
    }
  }

  /**
   * Get bundle count for a bundle
   */
  async getSetCount(bundleId: string): Promise<number> {
    const sets = await db
      .select()
      .from(bundleSets)
      .where(eq(bundleSets.bundleId, bundleId));

    return sets.length;
  }

  /**
   * Hydrate bundle with sets and items
   */
  private async hydrateBundle(bundleId: string): Promise<BundleResponseDto> {
    const [bundle] = await db
      .select()
      .from(bundles)
      .where(eq(bundles.id, bundleId))
      .limit(1);

    if (!bundle) {
      throw new NotFoundException(`Bundle with ID ${bundleId} not found`);
    }

    // Get sets ordered by sortOrder
    const sets = await db
      .select()
      .from(bundleSets)
      .where(eq(bundleSets.bundleId, bundleId))
      .orderBy(asc(bundleSets.sortOrder), asc(bundleSets.createdAt));

    // Get items for each set
    const setsWithItems = await Promise.all(
      sets.map(async (set) => {
        const items = await db
          .select()
          .from(bundleSetItems)
          .where(eq(bundleSetItems.setId, set.id));

        return {
          id: set.id,
          title: set.title,
          description: set.description || undefined,
          minQuantity: set.minQuantity,
          maxQuantity: set.maxQuantity,
          sortOrder: set.sortOrder,
          items: items.map((item) => ({
            id: item.id,
            variantId: item.variantId,
            createdAt: item.createdAt,
          })),
          createdAt: set.createdAt,
          updatedAt: set.updatedAt,
        };
      }),
    );

    return {
      id: bundle.id,
      title: bundle.title,
      description: bundle.description || undefined,
      isActive: bundle.isActive,
      allowMixAndMatch: bundle.allowMixAndMatch,
      sets: setsWithItems,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
    };
  }
}
