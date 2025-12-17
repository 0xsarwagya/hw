import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateCustomerGroupDto {
  @ApiProperty({
    description: "Customer group name",
    example: "B2B Corporate",
    maxLength: 255,
  })
  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @MaxLength(255, { message: "Name must not exceed 255 characters" })
  name: string;

  @ApiProperty({
    description: "Customer group description",
    example: "Corporate customers with special pricing",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @ApiProperty({
    description: "Whether customer group is active",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class UpdateCustomerGroupDto {
  @ApiProperty({
    description: "Customer group name",
    example: "B2B Corporate",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Name must be a string" })
  @MaxLength(255, { message: "Name must not exceed 255 characters" })
  name?: string;

  @ApiProperty({
    description: "Customer group description",
    example: "Corporate customers with special pricing",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @ApiProperty({
    description: "Whether customer group is active",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isActive must be a boolean" })
  isActive?: boolean;
}

export class AssignPriceListToGroupDto {
  @ApiProperty({
    description: "Price list ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty({ message: "Price list ID is required" })
  @IsUUID(4, { message: "Price list ID must be a valid UUID" })
  priceListId: string;

  @ApiProperty({
    description: "Priority within group (higher number = higher priority)",
    example: 10,
    default: 1,
  })
  @IsOptional()
  priority?: number;
}

export class CustomerGroupResponseDto {
  @ApiProperty({
    description: "Customer group ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Customer group name",
    example: "B2B Corporate",
  })
  name: string;

  @ApiProperty({
    description: "Customer group description",
    example: "Corporate customers with special pricing",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "Whether customer group is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Associated price lists",
    type: "array",
    items: {
      type: "object",
      properties: {
        priceListId: { type: "string" },
        priority: { type: "number" },
      },
    },
  })
  priceLists: Array<{ priceListId: string; priority: number }>;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}
