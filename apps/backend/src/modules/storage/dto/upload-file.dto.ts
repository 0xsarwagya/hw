import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CompressionOptionsDto } from "./compression-options.dto";

export class UploadFileDto {
  @ApiProperty({
    description: "File prefix/path in storage (e.g., 'products', 'avatars')",
    example: "products",
    required: false,
  })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiProperty({
    description: "Compression options for images",
    required: false,
    type: CompressionOptionsDto,
  })
  @IsOptional()
  compressionOptions?: CompressionOptionsDto;
}

export class BatchUploadFileDto {
  @ApiProperty({
    description: "File prefix/path in storage",
    example: "products",
    required: false,
  })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiProperty({
    description: "Compression options for images",
    required: false,
    type: CompressionOptionsDto,
  })
  @IsOptional()
  compressionOptions?: CompressionOptionsDto;
}
