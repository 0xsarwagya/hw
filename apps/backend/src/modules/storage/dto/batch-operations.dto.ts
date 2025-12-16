import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class BatchDeleteDto {
  @ApiProperty({
    description: "Array of file keys to delete",
    example: ["products/file1.webp", "products/file2.webp"],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  keys: string[];
}

export class BatchDeleteResponseDto {
  @ApiProperty({
    description: "Number of files successfully deleted",
    example: 2,
  })
  deleted: number;

  @ApiProperty({
    description: "Array of file keys that failed to delete",
    example: ["products/file3.webp"],
    type: [String],
  })
  failed: string[];
}

export class ListFilesDto {
  @ApiProperty({
    description: "Prefix to list files under",
    example: "products",
    required: false,
  })
  @IsString()
  @IsOptional()
  prefix?: string;

  @ApiProperty({
    description: "Maximum number of files to return",
    example: 100,
    minimum: 1,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxKeys?: number;
}

export class ListFilesResponseDto {
  @ApiProperty({
    description: "Array of file keys",
    example: ["products/file1.webp", "products/file2.webp"],
    type: [String],
  })
  files: string[];

  @ApiProperty({
    description: "Total number of files found",
    example: 2,
  })
  total: number;

  @ApiProperty({
    description: "Prefix used for listing",
    example: "products",
  })
  prefix: string;
}
