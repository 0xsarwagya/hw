import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  AssignPriceListToGroupDto,
  CreateCustomerGroupDto,
  CustomerGroupResponseDto,
  UpdateCustomerGroupDto,
} from "./dto/customer-group.dto";
import { CustomerGroupService } from "./services/customer-group.service";

@ApiTags("admin/customer-groups")
@Controller("admin/customer-groups")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class CustomerGroupsController {
  constructor(private readonly customerGroupService: CustomerGroupService) {}

  @Post()
  @ApiOperation({ summary: "Create a new customer group (admin)" })
  @ApiResponse({
    status: 201,
    description: "Customer group created successfully",
    type: CustomerGroupResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async create(
    @Body() createDto: CreateCustomerGroupDto,
  ): Promise<CustomerGroupResponseDto> {
    return this.customerGroupService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all customer groups (admin)" })
  @ApiResponse({
    status: 200,
    description: "Customer groups retrieved successfully",
    type: [CustomerGroupResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async findAll(): Promise<CustomerGroupResponseDto[]> {
    return this.customerGroupService.findAll();
  }

  @Get("active")
  @ApiOperation({ summary: "Get active customer groups (admin)" })
  @ApiResponse({
    status: 200,
    description: "Active customer groups retrieved successfully",
    type: [CustomerGroupResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async findActive(): Promise<CustomerGroupResponseDto[]> {
    return this.customerGroupService.findActive();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get customer group by ID (admin)" })
  @ApiParam({ name: "id", description: "Customer group ID" })
  @ApiResponse({
    status: 200,
    description: "Customer group retrieved successfully",
    type: CustomerGroupResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Customer group not found" })
  async findOne(@Param("id") id: string): Promise<CustomerGroupResponseDto> {
    return this.customerGroupService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update customer group (admin)" })
  @ApiParam({ name: "id", description: "Customer group ID" })
  @ApiResponse({
    status: 200,
    description: "Customer group updated successfully",
    type: CustomerGroupResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Customer group not found" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateCustomerGroupDto,
  ): Promise<CustomerGroupResponseDto> {
    return this.customerGroupService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete customer group (admin)" })
  @ApiParam({ name: "id", description: "Customer group ID" })
  @ApiResponse({
    status: 200,
    description: "Customer group deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Customer group not found" })
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    return this.customerGroupService.remove(id);
  }

  @Post(":id/price-lists")
  @ApiOperation({ summary: "Assign price list to customer group (admin)" })
  @ApiParam({ name: "id", description: "Customer group ID" })
  @ApiResponse({
    status: 200,
    description: "Price list assigned successfully",
    type: CustomerGroupResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "Customer group not found" })
  async assignPriceList(
    @Param("id") groupId: string,
    @Body() assignDto: AssignPriceListToGroupDto,
  ): Promise<CustomerGroupResponseDto> {
    return this.customerGroupService.assignPriceList(groupId, assignDto);
  }

  @Delete(":id/price-lists/:priceListId")
  @ApiOperation({ summary: "Remove price list from customer group (admin)" })
  @ApiParam({ name: "id", description: "Customer group ID" })
  @ApiParam({ name: "priceListId", description: "Price list ID" })
  @ApiResponse({
    status: 200,
    description: "Price list removed successfully",
    type: CustomerGroupResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({
    status: 404,
    description: "Customer group or price list not found",
  })
  async removePriceList(
    @Param("id") groupId: string,
    @Param("priceListId") priceListId: string,
  ): Promise<CustomerGroupResponseDto> {
    return this.customerGroupService.removePriceList(groupId, priceListId);
  }
}
