import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export enum ReviewSortOrder {
  NEWEST = "newest",
  OLDEST = "oldest",
  HIGHEST = "highest",
  LOWEST = "lowest",
  HELPFUL = "helpful",
}

export class ReviewQueryDto {
  @ApiProperty({
    description: "Page number (1-indexed)",
    example: 1,
    default: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Page must be an integer" })
  @Min(1, { message: "Page must be at least 1" })
  page?: number = 1;

  @ApiProperty({
    description: "Number of reviews per page",
    example: 20,
    default: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be at least 1" })
  @Max(100, { message: "Limit must be at most 100" })
  limit?: number = 20;

  @ApiProperty({
    description: "Sort order",
    example: "newest",
    enum: ReviewSortOrder,
    default: ReviewSortOrder.NEWEST,
    required: false,
  })
  @IsOptional()
  @IsEnum(ReviewSortOrder, {
    message: `Sort must be one of: ${Object.values(ReviewSortOrder).join(", ")}`,
  })
  sort?: ReviewSortOrder = ReviewSortOrder.NEWEST;

  @ApiProperty({
    description: "Filter by minimum rating (1-5)",
    example: 4,
    required: false,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Min rating must be an integer" })
  @Min(1, { message: "Min rating must be at least 1" })
  @Max(5, { message: "Min rating must be at most 5" })
  minRating?: number;

  @ApiProperty({
    description: "Filter to only show reviews with images",
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  imagesOnly?: boolean = false;
}
