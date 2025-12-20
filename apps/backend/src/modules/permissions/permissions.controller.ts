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
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { RATE_LIMIT_PRESETS } from "../../common/rate-limiting/rate-limit.config";
import {
  CreateRoleDto,
  RoleResponseDto,
  UpdateRoleDto,
} from "./dto/permissions.dto";
import { PermissionsService } from "./permissions.service";

@ApiTags("admin")
@Controller("admin/permissions/roles")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin") // Only admins can manage roles
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get all roles (admin)",
    description: "Retrieve a list of all admin roles with their permissions.",
  })
  @ApiResponse({
    status: 200,
    description: "List of roles retrieved successfully",
    type: [RoleResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getRoles(): Promise<RoleResponseDto[]> {
    return this.permissionsService.getRoles();
  }

  @Get(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_GET)
  @ApiOperation({
    summary: "Get role by ID (admin)",
    description: "Retrieve a single role by its ID.",
  })
  @ApiParam({
    name: "id",
    description: "Role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Role retrieved successfully",
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Role not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getRole(@Param("id") id: string): Promise<RoleResponseDto> {
    return this.permissionsService.getRole(id);
  }

  @Post()
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Create role (admin)",
    description: "Create a new admin role with specified permissions.",
  })
  @ApiResponse({
    status: 201,
    description: "Role created successfully",
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (invalid permissions, duplicate name, etc.)",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async createRole(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.permissionsService.createRole(dto);
  }

  @Put(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Update role (admin)",
    description: "Update an existing admin role.",
  })
  @ApiParam({
    name: "id",
    description: "Role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Role updated successfully",
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (invalid permissions, duplicate name, etc.)",
  })
  @ApiResponse({
    status: 404,
    description: "Role not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async updateRole(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.permissionsService.updateRole(id, dto);
  }

  @Delete(":id")
  @RateLimit(RATE_LIMIT_PRESETS.ADMIN_MUTATE)
  @ApiOperation({
    summary: "Delete role (admin)",
    description:
      "Delete an admin role. Cannot delete if role is assigned to any users.",
  })
  @ApiParam({
    name: "id",
    description: "Role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Role deleted successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request (role is assigned to users)",
  })
  @ApiResponse({
    status: 404,
    description: "Role not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async deleteRole(@Param("id") id: string): Promise<{ success: boolean }> {
    await this.permissionsService.deleteRole(id);
    return { success: true };
  }
}
