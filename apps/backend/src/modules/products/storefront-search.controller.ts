import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { QueryProductsDto } from "./dto/query-products.dto";
import { ProductsService } from "./products.service";

@ApiTags("store")
@Controller("store/search")
@Public()
export class StorefrontSearchController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.STOREFRONT_GET)
  @ApiOperation({
    summary: "Unified search endpoint",
    description:
      "Search for products with query string. Supports full-text search in title, description, and SKU.",
  })
  @ApiQuery({
    name: "q",
    required: true,
    type: String,
    description: "Search query",
    example: "wireless headphones",
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
    description: "Search results retrieved successfully",
  })
  async search(
    @Query("q") query: string,
    @Query() pagination: QueryProductsDto,
  ) {
    if (!query) {
      return {
        data: [],
        total: 0,
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    // Use ProductsService.findAll with search query
    return this.productsService.findAll({
      ...pagination,
      search: query,
    });
  }
}
