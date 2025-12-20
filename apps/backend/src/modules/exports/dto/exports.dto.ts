import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export enum ExportFormat {
  CSV = "csv",
  PDF = "pdf",
  ZIP = "zip",
}

export class ExportOrdersDto {
  @ApiProperty({
    description: "Export format",
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({
    description: "Start date filter (ISO 8601)",
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "End date filter (ISO 8601)",
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ExportProductsDto {
  @ApiProperty({
    description: "Export format",
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({
    description: "Category filter",
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class ExportCustomersDto {
  @ApiProperty({
    description: "Export format",
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;
}

export class ExportInventoryDto {
  @ApiProperty({
    description: "Export format",
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;
}

export class ExportResponseDto {
  @ApiProperty({
    description: "Signed URL for downloading the export",
    example: "https://storage.example.com/exports/orders-2025-01-01.csv",
  })
  url: string;
}
