import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateShippingMethodDto {
  @ApiProperty({
    description: "Shipping method name",
    example: "Standard Shipping",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: "Shipping method description",
    example: "Standard delivery within 5-7 business days",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Unique code for the shipping method",
    example: "standard",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({
    description: "Base shipping rate in paise",
    example: 5000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiProperty({
    description: "Estimated delivery days",
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  estimatedDays: number;

  @ApiProperty({
    description: "Whether COD is available",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  codAvailable?: boolean;

  @ApiProperty({
    description: "Additional COD charge in paise",
    example: 3000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  codCharge?: number;

  @ApiProperty({
    description: "Whether the method is active",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: "Display priority (higher = shown first)",
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiProperty({
    description: "Minimum order value in paise",
    example: 100000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty({
    description: "Maximum order value in paise",
    example: 10000000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxOrderValue?: number;

  @ApiProperty({
    description: "Restricted shipping zones",
    example: ["zone_e"],
    required: false,
  })
  @IsOptional()
  restrictedZones?: string[];

  @ApiProperty({
    description: "Restricted states",
    example: ["Jammu and Kashmir"],
    required: false,
  })
  @IsOptional()
  restrictedStates?: string[];
}

export class UpdateShippingMethodDto {
  @ApiProperty({
    description: "Shipping method name",
    example: "Standard Shipping",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: "Shipping method description",
    example: "Standard delivery within 5-7 business days",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Unique code for the shipping method",
    example: "standard",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiProperty({
    description: "Base shipping rate in paise",
    example: 5000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseRate?: number;

  @ApiProperty({
    description: "Estimated delivery days",
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDays?: number;

  @ApiProperty({
    description: "Whether COD is available",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  codAvailable?: boolean;

  @ApiProperty({
    description: "Additional COD charge in paise",
    example: 3000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  codCharge?: number;

  @ApiProperty({
    description: "Whether the method is active",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: "Display priority (higher = shown first)",
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiProperty({
    description: "Minimum order value in paise",
    example: 100000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty({
    description: "Maximum order value in paise",
    example: 10000000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxOrderValue?: number;

  @ApiProperty({
    description: "Restricted shipping zones",
    example: ["zone_e"],
    required: false,
  })
  @IsOptional()
  restrictedZones?: string[];

  @ApiProperty({
    description: "Restricted states",
    example: ["Jammu and Kashmir"],
    required: false,
  })
  @IsOptional()
  restrictedStates?: string[];
}

export class ShippingMethodResponseDto {
  @ApiProperty({
    description: "Shipping method ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Shipping method name",
    example: "Standard Shipping",
  })
  name: string;

  @ApiProperty({
    description: "Shipping method description",
    example: "Standard delivery within 5-7 business days",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "Unique code for the shipping method",
    example: "standard",
  })
  code: string;

  @ApiProperty({
    description: "Base shipping rate in paise",
    example: 5000,
  })
  baseRate: number;

  @ApiProperty({
    description: "Estimated delivery days",
    example: 5,
  })
  estimatedDays: number;

  @ApiProperty({
    description: "Whether COD is available",
    example: true,
  })
  codAvailable: boolean;

  @ApiProperty({
    description: "Additional COD charge in paise",
    example: 3000,
    nullable: true,
  })
  codCharge: number | null;

  @ApiProperty({
    description: "Whether the method is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Display priority",
    example: 0,
  })
  priority: number;

  @ApiProperty({
    description: "Minimum order value in paise",
    example: 100000,
    nullable: true,
  })
  minOrderValue: number | null;

  @ApiProperty({
    description: "Maximum order value in paise",
    example: 10000000,
    nullable: true,
  })
  maxOrderValue: number | null;

  @ApiProperty({
    description: "Restricted shipping zones",
    example: ["zone_e"],
    nullable: true,
  })
  restrictedZones: string[] | null;

  @ApiProperty({
    description: "Restricted states",
    example: ["Jammu and Kashmir"],
    nullable: true,
  })
  restrictedStates: string[] | null;

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

export interface AvailableShippingMethod {
  id: string;
  name: string;
  description: string | null;
  code: string;
  cost: number; // Final calculated cost in paise
  estimatedDays: number;
  codAvailable: boolean;
  codCharge: number | null;
}
