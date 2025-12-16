import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class GeneratePresignedUrlDto {
  @ApiProperty({
    description: "File key/path in storage",
    example: "products/20251216-abc123-def456.webp",
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: "Expiration time in seconds (default: 3600)",
    example: 3600,
    minimum: 1,
    maximum: 604800, // 7 days
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(604800)
  expiresIn?: number;
}

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: "File key/path in storage",
    example: "products/20251216-abc123-def456.webp",
  })
  key: string;

  @ApiProperty({
    description: "Presigned URL for direct upload",
    example:
      "http://localhost:9000/vcecom/products/20251216-abc123-def456.webp?signature=abc123",
  })
  url: string;

  @ApiProperty({
    description: "Expiration time in seconds",
    example: 3600,
  })
  expiresIn: number;
}
