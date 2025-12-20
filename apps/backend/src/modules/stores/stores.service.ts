import { Injectable } from "@nestjs/common";
import { db, eq, stores } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import { createErrorContext } from "../../common/logging/logging.helper";
import { StoreResponseDto, UpdateStoreDto } from "./dto/stores.dto";

@Injectable()
export class StoresService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Get the default store or first store
   */
  async getStore(): Promise<StoreResponseDto> {
    try {
      // Try to get default store first
      let [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.isDefault, true))
        .limit(1);

      // If no default store, get the first one
      if (!store) {
        [store] = await db.select().from(stores).limit(1);
      }

      // If still no store, create a default one
      if (!store) {
        const [created] = await db
          .insert(stores)
          .values({
            name: "Default Store",
            domain: "localhost",
            currency: "INR",
            isDefault: true,
          })
          .returning();

        return this.mapToResponseDto(created);
      }

      return this.mapToResponseDto(store);
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getStore", error),
        "Failed to get store",
      );
      throw error;
    }
  }

  /**
   * Update store metadata
   */
  async updateStore(dto: UpdateStoreDto): Promise<StoreResponseDto> {
    try {
      // Get current store (default or first)
      const currentStore = await this.getStore();

      // If setting a new default, unset all other defaults first
      if (dto.isDefault === true) {
        await db
          .update(stores)
          .set({ isDefault: false })
          .where(eq(stores.isDefault, true));
      }

      // Update store
      const [updated] = await db
        .update(stores)
        .set({
          name: dto.name ?? currentStore.name,
          domain: dto.domain ?? currentStore.domain,
          currency: dto.currency ?? currentStore.currency,
          primaryColor: dto.primaryColor ?? currentStore.primaryColor ?? null,
          logoUrl: dto.logoUrl ?? currentStore.logoUrl ?? null,
          isDefault: dto.isDefault ?? currentStore.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, currentStore.id))
        .returning();

      return this.mapToResponseDto(updated);
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "updateStore", error, { dto }),
        "Failed to update store",
      );
      throw error;
    }
  }

  /**
   * Extract store ID from x-store-id header (for future use)
   */
  getStoreFromHeader(storeIdHeader?: string): string | null {
    return storeIdHeader || null;
  }

  /**
   * Map database store to response DTO
   */
  private mapToResponseDto(
    store: typeof stores.$inferSelect,
  ): StoreResponseDto {
    return {
      id: store.id,
      name: store.name,
      domain: store.domain,
      currency: store.currency,
      primaryColor: store.primaryColor || null,
      logoUrl: store.logoUrl || null,
      isDefault: store.isDefault,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }
}
