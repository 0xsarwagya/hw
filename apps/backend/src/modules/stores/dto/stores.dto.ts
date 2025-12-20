import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdateStoreDto {
  @ApiPropertyOptional({
    description: "Store name",
    example: "My Store",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "Store domain",
    example: "mystore.com",
  })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({
    description: "Store currency",
    example: "INR",
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: "Primary color (hex code)",
    example: "#FF5733",
  })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({
    description: "Logo URL",
    example: "https://example.com/logo.png",
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: "Whether this is the default store",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class StoreResponseDto {
  @ApiProperty({
    description: "Store ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Store name",
  })
  name: string;

  @ApiProperty({
    description: "Store domain",
  })
  domain: string;

  @ApiProperty({
    description: "Store currency",
  })
  currency: string;

  @ApiPropertyOptional({
    description: "Primary color",
    nullable: true,
  })
  primaryColor?: string | null;

  @ApiPropertyOptional({
    description: "Logo URL",
    nullable: true,
  })
  logoUrl?: string | null;

  @ApiProperty({
    description: "Whether this is the default store",
  })
  isDefault: boolean;

  @ApiProperty({
    description: "Creation timestamp",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
  })
  updatedAt: Date;
}
