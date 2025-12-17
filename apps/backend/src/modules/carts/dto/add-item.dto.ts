import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from "class-validator";
import { UserBundleSelection } from "../../bundles/services/bundle-eligibility.service";

export class AddItemDto {
  @ApiProperty({
    description:
      "Item type: 'variant' for regular products, 'bundle' for bundles",
    example: "variant",
    enum: ["variant", "bundle"],
    default: "variant",
    required: false,
  })
  @IsOptional()
  @IsEnum(["variant", "bundle"], {
    message: "Type must be either 'variant' or 'bundle'",
  })
  type?: "variant" | "bundle" = "variant";

  @ApiProperty({
    description: "Product variant ID (required if type='variant')",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @ValidateIf((o) => o.type !== "bundle")
  @IsNotEmpty({ message: "Product variant ID is required for variant items" })
  @IsUUID(4, { message: "Product variant ID must be a valid UUID" })
  productVariantId?: string;

  @ApiProperty({
    description: "Bundle ID (required if type='bundle')",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @ValidateIf((o) => o.type === "bundle")
  @IsNotEmpty({ message: "Bundle ID is required for bundle items" })
  @IsUUID(4, { message: "Bundle ID must be a valid UUID" })
  bundleId?: string;

  @ApiProperty({
    description: "Bundle selections (required if type='bundle')",
    example: {
      "set-1": ["variant-1"],
      "set-2": ["variant-2", "variant-3"],
    },
    required: false,
  })
  @ValidateIf((o) => o.type === "bundle")
  @IsNotEmpty({ message: "Selections are required for bundle items" })
  @IsObject({ message: "Selections must be an object" })
  selections?: UserBundleSelection;

  @ApiProperty({
    description: "Quantity",
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsNotEmpty({ message: "Quantity is required" })
  @IsInt({ message: "Quantity must be an integer" })
  @Min(1, { message: "Quantity must be at least 1" })
  quantity: number;
}
