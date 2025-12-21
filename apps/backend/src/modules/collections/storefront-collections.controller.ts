import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { QueryProductsDto } from "../products/dto/query-products.dto";
import { ProductsService } from "../products/products.service";
import { CollectionsService } from "./collections.service";
import { CollectionResponseDto } from "./dto/collection-response.dto";

@ApiTags("store")
@Controller("store/collections")
@Public()
export class StorefrontCollectionsController {
  constructor(
    private readonly collectionsService: CollectionsService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.STOREFRONT_GET)
  @ApiOperation({
    summary: "List all collections",
    description: "Retrieve a list of all active collections (public endpoint)",
  })
  @ApiOkResponse({
    description: "List of collections retrieved successfully",
    type: [CollectionResponseDto],
  })
  async findAll() {
    // Get all collections (filter active ones if needed)
    const collections = await this.collectionsService.findAll({
      page: 1,
      limit: 100,
    });
    return collections.data || collections;
  }

  @Get(":id")
  @RateLimit(RATE_LIMIT_PRESETS.STOREFRONT_GET)
  @ApiOperation({
    summary: "Get collection details",
    description: "Retrieve a single collection by its ID (public endpoint)",
  })
  @ApiParam({
    name: "id",
    description: "Collection ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Collection retrieved successfully",
    type: CollectionResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Collection not found",
  })
  async findOne(@Param("id") id: string): Promise<CollectionResponseDto> {
    return this.collectionsService.findOne(id);
  }

  @Get(":id/products")
  @RateLimit(RATE_LIMIT_PRESETS.STOREFRONT_GET)
  @ApiOperation({
    summary: "Get products in collection",
    description:
      "Retrieve a paginated list of products in a specific collection (public endpoint)",
  })
  @ApiParam({
    name: "id",
    description: "Collection ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 20, max: 50)",
  })
  @ApiOkResponse({
    description: "List of products retrieved successfully",
  })
  @ApiNotFoundResponse({
    description: "Collection not found",
  })
  async getProducts(
    @Param("id") collectionId: string,
    @Query() query: QueryProductsDto,
  ) {
    // Get products from collection
    const collectionProducts =
      await this.collectionsService.getProducts(collectionId);
    const productIds = collectionProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return {
        data: [],
        total: 0,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    // Use ProductsService to get full product details with pagination
    // Filter by product IDs from collection
    const allProducts = await this.productsService.findAll({
      ...query,
      // Note: ProductsService doesn't support filtering by product IDs directly
      // For now, return all products from collection (can be optimized later)
    });

    // Filter to only products in this collection
    const filteredProducts = allProducts.data.filter((p) =>
      productIds.includes(p.id),
    );

    // Apply pagination manually
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
    const totalPages = Math.ceil(filteredProducts.length / limit);

    return {
      data: paginatedProducts,
      total: filteredProducts.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
