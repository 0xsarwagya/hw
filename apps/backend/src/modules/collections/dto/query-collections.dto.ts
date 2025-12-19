import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsInt, Min, Max, IsString } from "class-validator";

export class QueryCollectionsDto {
  @ApiProperty({
    description: "Page number",
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Page must be an integer" })
  @Min(1, { message: "Page must be at least 1" })
  page?: number = 1;

  @ApiProperty({
    description: "Items per page",
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be at least 1" })
  @Max(100, { message: "Limit must not exceed 100" })
  limit?: number = 10;

  @ApiProperty({
    description: "Search query (searches in name and description)",
    example: "summer",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Search must be a string" })
  search?: string;
}

