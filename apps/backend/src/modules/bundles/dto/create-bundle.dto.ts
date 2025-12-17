import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class CreateBundleDto {
  @ApiProperty({
    description: "Bundle title",
    example: "Summer Bundle",
    required: true,
  })
  @IsString({ message: "Title must be a string" })
  @MinLength(1, { message: "Title must be at least 1 character" })
  title: string;

  @ApiProperty({
    description: "Bundle description",
    example: "A great summer bundle with multiple choices",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @ApiProperty({
    description: "Whether bundle is active",
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Is active must be a boolean" })
  isActive?: boolean = true;

  @ApiProperty({
    description: "Allow mix and match pricing (for Phase 14-2)",
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Allow mix and match must be a boolean" })
  allowMixAndMatch?: boolean = false;
}
