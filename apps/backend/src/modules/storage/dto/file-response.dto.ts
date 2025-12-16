import { ApiProperty } from "@nestjs/swagger";

export class FileResponseDto {
  @ApiProperty({
    description: "File key/path in storage",
    example: "products/20251216-abc123-def456.webp",
  })
  key: string;

  @ApiProperty({
    description: "Public URL of the uploaded file",
    example:
      "http://localhost:9000/vcecom/products/20251216-abc123-def456.webp",
  })
  url: string;

  @ApiProperty({
    description: "File size in bytes",
    example: 123456,
  })
  size: number;

  @ApiProperty({
    description: "MIME type of the file",
    example: "image/webp",
  })
  contentType: string;

  @ApiProperty({
    description: "Original filename",
    example: "product-image.jpg",
    required: false,
  })
  originalName?: string;
}

export class FileMetadataDto {
  @ApiProperty({
    description: "File key/path in storage",
    example: "products/20251216-abc123-def456.webp",
  })
  key: string;

  @ApiProperty({
    description: "Public URL of the file",
    example:
      "http://localhost:9000/vcecom/products/20251216-abc123-def456.webp",
  })
  url: string;

  @ApiProperty({
    description: "File size in bytes",
    example: 123456,
    required: false,
  })
  size?: number;

  @ApiProperty({
    description: "MIME type of the file",
    example: "image/webp",
    required: false,
  })
  contentType?: string;
}
