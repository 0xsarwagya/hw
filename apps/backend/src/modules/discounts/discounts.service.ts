import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  and,
  db,
  desc,
  discountCategories,
  discountCollections,
  discountExclusions,
  discountGetCategories,
  discountGetCollections,
  discountGetProducts,
  discountGetTags,
  discountProducts,
  discounts,
  discountTags,
  discountTieredRules,
  discountUsages,
  eq,
} from "@vcecom/db";
import {
  CreateDiscountDto,
  DiscountApplicationType,
  DiscountScope,
  DiscountType,
  DiscountValueType,
} from "./dto/create-discount.dto";
import { DiscountResponseDto } from "./dto/discount-response.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";

@Injectable()
export class DiscountsService {
  /**
   * Create a new discount
   */
  async create(
    createDiscountDto: CreateDiscountDto,
  ): Promise<DiscountResponseDto> {
    // Validate discount code uniqueness
    const [existing] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.code, createDiscountDto.code))
      .limit(1);

    if (existing) {
      throw new BadRequestException(
        `Discount code '${createDiscountDto.code}' already exists`,
      );
    }

    // Validate dates
    const startDate = new Date(createDiscountDto.startDate);
    const endDate = createDiscountDto.endDate
      ? new Date(createDiscountDto.endDate)
      : null;

    if (endDate && endDate <= startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    // Validate value based on type
    if (
      createDiscountDto.valueType === "PERCENTAGE" &&
      createDiscountDto.value > 100
    ) {
      throw new BadRequestException("Percentage discount cannot exceed 100%");
    }

    // Create discount
    const [newDiscount] = await db
      .insert(discounts)
      .values({
        code: createDiscountDto.code,
        name: createDiscountDto.name,
        description: createDiscountDto.description || null,
        type: createDiscountDto.type,
        applicationType: createDiscountDto.applicationType || "MANUAL",
        valueType: createDiscountDto.valueType,
        value: createDiscountDto.value,
        minOrderAmount: createDiscountDto.minOrderAmount || null,
        maxDiscountAmount: createDiscountDto.maxDiscountAmount || null,
        minQuantity: createDiscountDto.minQuantity || null,
        customerGroupIds: createDiscountDto.customerGroupIds || null,
        scope: createDiscountDto.scope || "PRODUCT",
        priority: createDiscountDto.priority || 1,
        canStack: createDiscountDto.canStack ?? true,
        mutuallyExclusive: createDiscountDto.mutuallyExclusive ?? false,
        startDate,
        endDate,
        isActive: createDiscountDto.isActive ?? true,
        usageLimit: createDiscountDto.usageLimit || null,
        usageCount: 0,
        perUserLimit: createDiscountDto.perUserLimit || null,
      })
      .returning();

    // Create relationships for product-level discounts
    if (
      createDiscountDto.type === DiscountType.FIXED_AMOUNT ||
      createDiscountDto.type === DiscountType.PERCENTAGE ||
      createDiscountDto.type === DiscountType.TIERED
    ) {
      await this.createStandardDiscountRelations(
        newDiscount.id,
        createDiscountDto,
      );
    }

    // Create relationships for BUY_X_GET_Y type
    if (createDiscountDto.type === DiscountType.BUY_X_GET_Y) {
      await this.createBuyGetDiscountRelations(
        newDiscount.id,
        createDiscountDto,
      );
    }

    // Create tiered rules for TIERED type
    if (
      createDiscountDto.type === DiscountType.TIERED &&
      createDiscountDto.tieredRules
    ) {
      await this.createTieredRules(
        newDiscount.id,
        createDiscountDto.tieredRules,
      );
    }

    // Create exclusions
    if (
      createDiscountDto.excludedDiscountIds &&
      createDiscountDto.excludedDiscountIds.length > 0
    ) {
      await this.createDiscountExclusions(
        newDiscount.id,
        createDiscountDto.excludedDiscountIds,
      );
    }

    return this.enrichDiscountWithRelations(newDiscount.id);
  }

  /**
   * Get all discounts with pagination
   */
  async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const allDiscounts = await db
      .select()
      .from(discounts)
      .orderBy(desc(discounts.createdAt))
      .limit(limit)
      .offset(offset);

    const allDiscountsForCount = await db.select().from(discounts);
    const total = allDiscountsForCount.length;
    const totalPages = Math.ceil(total / limit);

    const enrichedDiscounts = await Promise.all(
      allDiscounts.map((discount) =>
        this.enrichDiscountWithRelations(discount.id),
      ),
    );

    return {
      data: enrichedDiscounts,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get discount by ID
   */
  async findOne(id: string): Promise<DiscountResponseDto> {
    const [discount] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.id, id))
      .limit(1);

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    return this.enrichDiscountWithRelations(discount.id);
  }

  /**
   * Get discount by code
   */
  async findByCode(code: string): Promise<DiscountResponseDto> {
    const [discount] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.code, code))
      .limit(1);

    if (!discount) {
      throw new NotFoundException(`Discount with code '${code}' not found`);
    }

    return this.enrichDiscountWithRelations(discount.id);
  }

  /**
   * Update discount
   */
  async update(
    id: string,
    updateDiscountDto: UpdateDiscountDto,
  ): Promise<DiscountResponseDto> {
    const [existing] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Validate code uniqueness if code is being updated
    if (updateDiscountDto.code && updateDiscountDto.code !== existing.code) {
      const [codeExists] = await db
        .select()
        .from(discounts)
        .where(eq(discounts.code, updateDiscountDto.code))
        .limit(1);

      if (codeExists) {
        throw new BadRequestException(
          `Discount code '${updateDiscountDto.code}' already exists`,
        );
      }
    }

    // Validate dates
    const startDate = updateDiscountDto.startDate
      ? new Date(updateDiscountDto.startDate)
      : existing.startDate;
    const endDate = updateDiscountDto.endDate
      ? new Date(updateDiscountDto.endDate)
      : existing.endDate;

    if (endDate && endDate <= startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    // Build update data
    const updateData: Partial<typeof discounts.$inferInsert> = {};
    if (updateDiscountDto.code !== undefined)
      updateData.code = updateDiscountDto.code;
    if (updateDiscountDto.name !== undefined)
      updateData.name = updateDiscountDto.name;
    if (updateDiscountDto.description !== undefined)
      updateData.description = updateDiscountDto.description || null;
    if (updateDiscountDto.type !== undefined)
      updateData.type = updateDiscountDto.type;
    if (updateDiscountDto.applicationType !== undefined)
      updateData.applicationType = updateDiscountDto.applicationType;
    if (updateDiscountDto.valueType !== undefined)
      updateData.valueType = updateDiscountDto.valueType;
    if (updateDiscountDto.value !== undefined)
      updateData.value = updateDiscountDto.value;
    if (updateDiscountDto.minOrderAmount !== undefined)
      updateData.minOrderAmount = updateDiscountDto.minOrderAmount || null;
    if (updateDiscountDto.maxDiscountAmount !== undefined)
      updateData.maxDiscountAmount =
        updateDiscountDto.maxDiscountAmount || null;
    if (updateDiscountDto.scope !== undefined)
      updateData.scope = updateDiscountDto.scope;
    if (updateDiscountDto.startDate !== undefined)
      updateData.startDate = startDate;
    if (updateDiscountDto.endDate !== undefined) updateData.endDate = endDate;
    if (updateDiscountDto.isActive !== undefined)
      updateData.isActive = updateDiscountDto.isActive;
    if (updateDiscountDto.usageLimit !== undefined)
      updateData.usageLimit = updateDiscountDto.usageLimit || null;
    if (updateDiscountDto.perUserLimit !== undefined)
      updateData.perUserLimit = updateDiscountDto.perUserLimit || null;

    // Update discount
    const [updated] = await db
      .update(discounts)
      .set(updateData)
      .where(eq(discounts.id, id))
      .returning();

    // Update relationships if type changed or IDs provided
    if (
      updateDiscountDto.type !== undefined ||
      updateDiscountDto.productIds !== undefined ||
      updateDiscountDto.categoryIds !== undefined ||
      updateDiscountDto.collectionIds !== undefined ||
      updateDiscountDto.tagIds !== undefined ||
      updateDiscountDto.buyProductIds !== undefined ||
      updateDiscountDto.buyCategoryIds !== undefined ||
      updateDiscountDto.buyCollectionIds !== undefined ||
      updateDiscountDto.buyTagIds !== undefined ||
      updateDiscountDto.getProductIds !== undefined ||
      updateDiscountDto.getCategoryIds !== undefined ||
      updateDiscountDto.getCollectionIds !== undefined ||
      updateDiscountDto.getTagIds !== undefined
    ) {
      // Delete existing relationships
      await this.deleteDiscountRelations(id, updated.type);

      // Create new relationships
      if (
        updated.type === DiscountType.FIXED_AMOUNT ||
        updated.type === DiscountType.PERCENTAGE ||
        updated.type === DiscountType.TIERED
      ) {
        await this.createStandardDiscountRelations(
          id,
          updateDiscountDto as CreateDiscountDto,
        );
      } else if (updated.type === DiscountType.BUY_X_GET_Y) {
        await this.createBuyGetDiscountRelations(
          id,
          updateDiscountDto as CreateDiscountDto,
        );
      }
    }

    return this.enrichDiscountWithRelations(id);
  }

  /**
   * Delete discount
   */
  async remove(id: string): Promise<{ message: string }> {
    const [existing] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Delete discount (cascade will delete relationships)
    await db.delete(discounts).where(eq(discounts.id, id));

    return { message: "Discount deleted successfully" };
  }

  /**
   * Validate discount code
   */
  async validateDiscount(
    code: string,
    userId?: string,
    orderAmount?: number,
  ): Promise<{
    isValid: boolean;
    discount?: DiscountResponseDto;
    error?: string;
  }> {
    try {
      const discount = await this.findByCode(code);

      // Check if active
      if (!discount.isActive) {
        return {
          isValid: false,
          error: "Discount code is not active",
        };
      }

      // Check expiry
      const now = new Date();
      if (discount.startDate > now) {
        return {
          isValid: false,
          error: "Discount code has not started yet",
        };
      }

      if (discount.endDate && discount.endDate < now) {
        return {
          isValid: false,
          error: "Discount code has expired",
        };
      }

      // Check usage limit
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        return {
          isValid: false,
          error: "Discount code usage limit reached",
        };
      }

      // Check per user limit
      if (userId && discount.perUserLimit) {
        const userUsages = await db
          .select()
          .from(discountUsages)
          .where(
            and(
              eq(discountUsages.discountId, discount.id),
              eq(discountUsages.userId, userId),
            ),
          );

        if (userUsages.length >= discount.perUserLimit) {
          return {
            isValid: false,
            error: "You have reached the usage limit for this discount code",
          };
        }
      }

      // Check minimum order amount
      if (orderAmount && discount.minOrderAmount) {
        if (orderAmount < discount.minOrderAmount) {
          return {
            isValid: false,
            error: `Minimum order amount of ₹${discount.minOrderAmount} required`,
          };
        }
      }

      return {
        isValid: true,
        discount,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          isValid: false,
          error: "Invalid discount code",
        };
      }
      throw error;
    }
  }

  /**
   * Record discount usage
   */
  async recordUsage(
    discountId: string,
    orderId: string,
    userId?: string,
  ): Promise<void> {
    await db.insert(discountUsages).values({
      discountId,
      orderId,
      userId: userId || null,
    });

    // Increment usage count
    const [currentDiscount] = await db
      .select({ usageCount: discounts.usageCount })
      .from(discounts)
      .where(eq(discounts.id, discountId))
      .limit(1);

    if (currentDiscount) {
      await db
        .update(discounts)
        .set({
          usageCount: currentDiscount.usageCount + 1,
        })
        .where(eq(discounts.id, discountId));
    }
  }

  /**
   * Create STANDARD discount relationships
   */
  private async createStandardDiscountRelations(
    discountId: string,
    dto: CreateDiscountDto,
  ): Promise<void> {
    // Products
    if (dto.productIds && dto.productIds.length > 0) {
      await db.insert(discountProducts).values(
        dto.productIds.map((productId) => ({
          discountId,
          productId,
        })),
      );
    }

    // Categories
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      await db.insert(discountCategories).values(
        dto.categoryIds.map((categoryId) => ({
          discountId,
          categoryId,
        })),
      );
    }

    // Collections
    if (dto.collectionIds && dto.collectionIds.length > 0) {
      await db.insert(discountCollections).values(
        dto.collectionIds.map((collectionId) => ({
          discountId,
          collectionId,
        })),
      );
    }

    // Tags
    if (dto.tagIds && dto.tagIds.length > 0) {
      await db.insert(discountTags).values(
        dto.tagIds.map((tagId) => ({
          discountId,
          tagId,
        })),
      );
    }
  }

  /**
   * Create BUY_GET discount relationships
   */
  private async createBuyGetDiscountRelations(
    discountId: string,
    dto: CreateDiscountDto,
  ): Promise<void> {
    // Buy products
    if (dto.buyProductIds && dto.buyProductIds.length > 0) {
      await db.insert(discountProducts).values(
        dto.buyProductIds.map((productId) => ({
          discountId,
          productId,
        })),
      );
    }

    // Buy categories
    if (dto.buyCategoryIds && dto.buyCategoryIds.length > 0) {
      await db.insert(discountCategories).values(
        dto.buyCategoryIds.map((categoryId) => ({
          discountId,
          categoryId,
        })),
      );
    }

    // Buy collections
    if (dto.buyCollectionIds && dto.buyCollectionIds.length > 0) {
      await db.insert(discountCollections).values(
        dto.buyCollectionIds.map((collectionId) => ({
          discountId,
          collectionId,
        })),
      );
    }

    // Buy tags
    if (dto.buyTagIds && dto.buyTagIds.length > 0) {
      await db.insert(discountTags).values(
        dto.buyTagIds.map((tagId) => ({
          discountId,
          tagId,
        })),
      );
    }

    // Get products
    if (dto.getProductIds && dto.getProductIds.length > 0) {
      await db.insert(discountGetProducts).values(
        dto.getProductIds.map((productId) => ({
          discountId,
          productId,
        })),
      );
    }

    // Get categories
    if (dto.getCategoryIds && dto.getCategoryIds.length > 0) {
      await db.insert(discountGetCategories).values(
        dto.getCategoryIds.map((categoryId) => ({
          discountId,
          categoryId,
        })),
      );
    }

    // Get collections
    if (dto.getCollectionIds && dto.getCollectionIds.length > 0) {
      await db.insert(discountGetCollections).values(
        dto.getCollectionIds.map((collectionId) => ({
          discountId,
          collectionId,
        })),
      );
    }

    // Get tags
    if (dto.getTagIds && dto.getTagIds.length > 0) {
      await db.insert(discountGetTags).values(
        dto.getTagIds.map((tagId) => ({
          discountId,
          tagId,
        })),
      );
    }
  }

  /**
   * Delete all discount relationships
   */
  private async deleteDiscountRelations(
    discountId: string,
    type: string,
  ): Promise<void> {
    // Delete STANDARD relationships
    await db
      .delete(discountProducts)
      .where(eq(discountProducts.discountId, discountId));
    await db
      .delete(discountCategories)
      .where(eq(discountCategories.discountId, discountId));
    await db
      .delete(discountCollections)
      .where(eq(discountCollections.discountId, discountId));
    await db
      .delete(discountTags)
      .where(eq(discountTags.discountId, discountId));

    // Delete BUY_X_GET_Y relationships
    if (type === DiscountType.BUY_X_GET_Y) {
      await db
        .delete(discountGetProducts)
        .where(eq(discountGetProducts.discountId, discountId));
      await db
        .delete(discountGetCategories)
        .where(eq(discountGetCategories.discountId, discountId));
      await db
        .delete(discountGetCollections)
        .where(eq(discountGetCollections.discountId, discountId));
      await db
        .delete(discountGetTags)
        .where(eq(discountGetTags.discountId, discountId));
    }
  }

  /**
   * Enrich discount with relationships
   */
  private async enrichDiscountWithRelations(
    discountId: string,
  ): Promise<DiscountResponseDto> {
    const [discount] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.id, discountId))
      .limit(1);

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${discountId} not found`);
    }

    // Get product IDs
    const discountProductsList = await db
      .select({ productId: discountProducts.productId })
      .from(discountProducts)
      .where(eq(discountProducts.discountId, discountId));

    // Get category IDs
    const discountCategoriesList = await db
      .select({ categoryId: discountCategories.categoryId })
      .from(discountCategories)
      .where(eq(discountCategories.discountId, discountId));

    // Get collection IDs
    const discountCollectionsList = await db
      .select({ collectionId: discountCollections.collectionId })
      .from(discountCollections)
      .where(eq(discountCollections.discountId, discountId));

    // Get tag IDs
    const discountTagsList = await db
      .select({ tagId: discountTags.tagId })
      .from(discountTags)
      .where(eq(discountTags.discountId, discountId));

    // Get BUY_GET relationships
    const getProductsList = await db
      .select({ productId: discountGetProducts.productId })
      .from(discountGetProducts)
      .where(eq(discountGetProducts.discountId, discountId));

    const getCategoriesList = await db
      .select({ categoryId: discountGetCategories.categoryId })
      .from(discountGetCategories)
      .where(eq(discountGetCategories.discountId, discountId));

    const getCollectionsList = await db
      .select({ collectionId: discountGetCollections.collectionId })
      .from(discountGetCollections)
      .where(eq(discountGetCollections.discountId, discountId));

    const getTagsList = await db
      .select({ tagId: discountGetTags.tagId })
      .from(discountGetTags)
      .where(eq(discountGetTags.discountId, discountId));

    // Get tiered rules
    const tieredRulesList = await db
      .select({
        minQuantity: discountTieredRules.minQuantity,
        value: discountTieredRules.value,
        valueType: discountTieredRules.valueType,
      })
      .from(discountTieredRules)
      .where(eq(discountTieredRules.discountId, discountId))
      .orderBy(discountTieredRules.minQuantity);

    // Get exclusions
    const exclusionsList = await db
      .select({ excludedDiscountId: discountExclusions.excludedDiscountId })
      .from(discountExclusions)
      .where(eq(discountExclusions.discountId, discountId));

    return {
      id: discount.id,
      code: discount.code,
      name: discount.name,
      description: discount.description,
      type: discount.type as DiscountType,
      applicationType: discount.applicationType as DiscountApplicationType,
      valueType: discount.valueType as DiscountValueType,
      value: Number(discount.value),
      minOrderAmount: discount.minOrderAmount
        ? Number(discount.minOrderAmount)
        : null,
      maxDiscountAmount: discount.maxDiscountAmount
        ? Number(discount.maxDiscountAmount)
        : null,
      scope: discount.scope as DiscountScope,
      priority: discount.priority,
      canStack: discount.canStack,
      mutuallyExclusive: discount.mutuallyExclusive,
      minQuantity: discount.minQuantity ? Number(discount.minQuantity) : null,
      customerGroupIds: discount.customerGroupIds,
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive,
      usageLimit: discount.usageLimit,
      usageCount: discount.usageCount,
      perUserLimit: discount.perUserLimit,
      // For BUY_X_GET_Y type, productIds/categoryIds etc. are the "buy" items
      // For other types, they are the items the discount applies to
      productIds:
        discount.type === DiscountType.BUY_X_GET_Y
          ? []
          : discountProductsList.map((p) => p.productId),
      categoryIds:
        discount.type === DiscountType.BUY_X_GET_Y
          ? []
          : discountCategoriesList.map((c) => c.categoryId),
      collectionIds:
        discount.type === DiscountType.BUY_X_GET_Y
          ? []
          : discountCollectionsList.map((c) => c.collectionId),
      tagIds:
        discount.type === DiscountType.BUY_X_GET_Y
          ? []
          : discountTagsList.map((t) => t.tagId),
      buyProductIds:
        discount.type === DiscountType.BUY_X_GET_Y
          ? discountProductsList.map((p) => p.productId)
          : [],
      buyCategoryIds:
        discount.type === DiscountType.BUY_X_GET_Y
          ? discountCategoriesList.map((c) => c.categoryId)
          : [],
      buyCollectionIds:
        discount.type === DiscountType.BUY_X_GET_Y
          ? discountCollectionsList.map((c) => c.collectionId)
          : [],
      buyTagIds:
        discount.type === DiscountType.BUY_X_GET_Y
          ? discountTagsList.map((t) => t.tagId)
          : [],
      getProductIds: getProductsList.map((p) => p.productId),
      getCategoryIds: getCategoriesList.map((c) => c.categoryId),
      getCollectionIds: getCollectionsList.map((c) => c.collectionId),
      getTagIds: getTagsList.map((t) => t.tagId),
      tieredRules: tieredRulesList.map((rule) => ({
        minQuantity: Number(rule.minQuantity),
        value: Number(rule.value),
        valueType: rule.valueType as DiscountValueType,
      })),
      excludedDiscountIds: exclusionsList.map((e) => e.excludedDiscountId),
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
    };
  }

  /**
   * Create tiered rules for a discount
   */
  private async createTieredRules(
    discountId: string,
    tieredRules: Array<{
      minQuantity: number;
      value: number;
      valueType: string;
    }>,
  ): Promise<void> {
    const rules = tieredRules.map((rule) => ({
      discountId,
      minQuantity: rule.minQuantity,
      value: rule.value,
      valueType: rule.valueType as DiscountValueType,
    }));

    await db.insert(discountTieredRules).values(rules);
  }

  /**
   * Create discount exclusions
   */
  private async createDiscountExclusions(
    discountId: string,
    excludedDiscountIds: string[],
  ): Promise<void> {
    const exclusions = excludedDiscountIds.map((excludedId) => ({
      discountId,
      excludedDiscountId: excludedId,
    }));

    await db.insert(discountExclusions).values(exclusions);
  }
}
