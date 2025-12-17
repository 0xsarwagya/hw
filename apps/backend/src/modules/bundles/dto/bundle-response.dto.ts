import { ApiProperty } from "@nestjs/swagger";
import { BundleSetResponseDto } from "./bundle-set-response.dto";

export class BundleResponseDto {
  @ApiProperty({
    description: "Bundle ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Bundle title",
    example: "Summer Bundle",
  })
  title: string;

  @ApiProperty({
    description: "Bundle description",
    example: "A great summer bundle with multiple choices",
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: "Whether bundle is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Allow mix and match pricing",
    example: false,
  })
  allowMixAndMatch: boolean;

  @ApiProperty({
    description: "Choice sets in this bundle",
    type: [BundleSetResponseDto],
  })
  sets: BundleSetResponseDto[];

  @ApiProperty({
    description: "Created at timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2025-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}
