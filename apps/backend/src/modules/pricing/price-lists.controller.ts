import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PricingDriftSeverity } from "./audit/pricing-audit.types";
import {
  CreatePriceListDto,
  CreatePriceListItemDto,
} from "./dto/create-price-list.dto";
import { PriceListResponseDto } from "./dto/price-list-response.dto";
import {
  AdminPricingDriftReportService,
  PricingDriftReportQuery,
} from "./services/admin-pricing-drift-report.service";
import { PriceListService } from "./services/price-list.service";

@ApiTags("admin/price-lists")
@Controller("admin/price-lists")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class PriceListsController {
  constructor(
    private readonly priceListService: PriceListService,
    private readonly adminDriftReportService: AdminPricingDriftReportService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new price list (admin)" })
  @ApiResponse({
    status: 201,
    description: "Price list created successfully",
    type: PriceListResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async create(
    @Body() createDto: CreatePriceListDto,
  ): Promise<PriceListResponseDto> {
    return this.priceListService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all price lists (admin)" })
  @ApiResponse({
    status: 200,
    description: "Price lists retrieved successfully",
    type: [PriceListResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async findAll(): Promise<PriceListResponseDto[]> {
    return this.priceListService.findAll();
  }

  @Get("active")
  @ApiOperation({ summary: "Get active price lists (admin)" })
  @ApiResponse({
    status: 200,
    description: "Active price lists retrieved successfully",
    type: [PriceListResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async findActive(): Promise<PriceListResponseDto[]> {
    return this.priceListService.findActive();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get price list by ID (admin)" })
  @ApiParam({ name: "id", description: "Price list ID" })
  @ApiResponse({
    status: 200,
    description: "Price list retrieved successfully",
    type: PriceListResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Price list not found" })
  async findOne(@Param("id") id: string): Promise<PriceListResponseDto> {
    return this.priceListService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update price list (admin)" })
  @ApiParam({ name: "id", description: "Price list ID" })
  @ApiResponse({
    status: 200,
    description: "Price list updated successfully",
    type: PriceListResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Price list not found" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: Partial<CreatePriceListDto>,
  ): Promise<PriceListResponseDto> {
    return this.priceListService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete price list (admin)" })
  @ApiParam({ name: "id", description: "Price list ID" })
  @ApiResponse({
    status: 200,
    description: "Price list deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Price list not found" })
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    return this.priceListService.remove(id);
  }

  @Post(":id/items")
  @ApiOperation({ summary: "Add item to price list (admin)" })
  @ApiParam({ name: "id", description: "Price list ID" })
  @ApiResponse({
    status: 200,
    description: "Item added to price list successfully",
    type: PriceListResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid item data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Price list not found" })
  async addItem(
    @Param("id") priceListId: string,
    @Body() createItemDto: CreatePriceListItemDto,
  ): Promise<PriceListResponseDto> {
    return this.priceListService.addItem(priceListId, createItemDto);
  }

  @Delete(":id/items/:itemId")
  @ApiOperation({ summary: "Remove item from price list (admin)" })
  @ApiParam({ name: "id", description: "Price list ID" })
  @ApiParam({ name: "itemId", description: "Price list item ID" })
  @ApiResponse({
    status: 200,
    description: "Item removed from price list successfully",
    type: PriceListResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Price list or item not found" })
  async removeItem(
    @Param("id") priceListId: string,
    @Param("itemId") itemId: string,
  ): Promise<PriceListResponseDto> {
    return this.priceListService.removeItem(priceListId, itemId);
  }

  @Get("drift-report")
  @ApiOperation({
    summary: "Get pricing drift report (admin)",
    description: "Retrieve drift detection events with filtering options",
  })
  @ApiQuery({ name: "variantId", required: false, type: String })
  @ApiQuery({ name: "checkoutId", required: false, type: String })
  @ApiQuery({ name: "orderId", required: false, type: String })
  @ApiQuery({ name: "priceListId", required: false, type: String })
  @ApiQuery({ name: "customerGroupId", required: false, type: String })
  @ApiQuery({ name: "dateFrom", required: false, type: Date })
  @ApiQuery({ name: "dateTo", required: false, type: Date })
  @ApiQuery({ name: "severity", required: false, enum: PricingDriftSeverity })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Pricing drift report retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getDriftReport(@Query() query: PricingDriftReportQuery) {
    return this.adminDriftReportService.getDriftReport(query);
  }
}
