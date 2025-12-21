import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import { CategoriesService } from "./categories.service";
import {
  CategoryResponseDto,
  CategoryTreeDto,
} from "./dto/category-response.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@ApiTags("admin")
@Controller("admin/categories")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get all categories (admin)",
    description: "Retrieve a list of all categories (admin view)",
  })
  @ApiOkResponse({
    description: "List of categories retrieved successfully",
    type: [CategoryResponseDto],
  })
  async findAll(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll();
  }

  @Get("tree")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get category tree (admin)",
    description:
      "Retrieve categories in hierarchical tree structure (admin view)",
  })
  @ApiOkResponse({
    description: "Category tree retrieved successfully",
    type: [CategoryTreeDto],
  })
  async findTree(): Promise<CategoryTreeDto[]> {
    return this.categoriesService.findTree();
  }

  @Get(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get category by ID (admin)",
    description: "Retrieve a single category by its ID (admin view)",
  })
  @ApiParam({
    name: "id",
    description: "Category ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Category retrieved successfully",
    type: CategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Category not found",
  })
  async findOne(@Param("id") id: string): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Create a new category",
    description: "Create a new category (admin only)",
  })
  @ApiCreatedResponse({
    description: "Category created successfully",
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid input or parent category not found",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  @ApiForbiddenResponse({
    description: "Access denied. Admin role required.",
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Update a category",
    description: "Update an existing category (admin only)",
  })
  @ApiParam({
    name: "id",
    description: "Category ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Category updated successfully",
    type: CategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Category not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid input, circular reference, or parent not found",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  @ApiForbiddenResponse({
    description: "Access denied. Admin role required.",
  })
  async update(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Delete a category",
    description:
      "Delete a category (admin only). Cannot delete categories with children.",
  })
  @ApiParam({
    name: "id",
    description: "Category ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Category deleted successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Category deleted successfully",
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Category not found",
  })
  @ApiBadRequestResponse({
    description: "Cannot delete category with children",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  @ApiForbiddenResponse({
    description: "Access denied. Admin role required.",
  })
  async remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
