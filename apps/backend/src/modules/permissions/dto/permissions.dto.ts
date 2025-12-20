import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class PermissionScopeDto {
  @ApiProperty({
    description: "Resource name",
    example: "products",
  })
  @IsString()
  resource: string;

  @ApiProperty({
    description: "Allowed actions",
    example: ["read", "write"],
    type: [String],
  })
  @IsString({ each: true })
  actions: string[];
}

export class CreateRoleDto {
  @ApiProperty({
    description: "Role name",
    example: "inventory_manager",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "Permissions object",
    example: {
      products: ["read", "write"],
      orders: ["read"],
      inventory: ["read", "adjust"],
    },
  })
  @IsObject()
  permissions: Record<string, string[]>;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: "Role name",
    example: "inventory_manager",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "Permissions object",
    example: {
      products: ["read", "write"],
      orders: ["read"],
      inventory: ["read", "adjust"],
    },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, string[]>;
}

export class RoleResponseDto {
  @ApiProperty({
    description: "Role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Role name",
    example: "inventory_manager",
  })
  name: string;

  @ApiProperty({
    description: "Permissions object",
    example: {
      products: ["read", "write"],
      orders: ["read"],
      inventory: ["read", "adjust"],
    },
  })
  permissions: Record<string, string[]>;

  @ApiProperty({
    description: "Creation timestamp",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
  })
  updatedAt: Date;
}
