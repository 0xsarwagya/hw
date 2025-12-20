import { ApiProperty } from "@nestjs/swagger";

export class OrderNoteResponseDto {
  @ApiProperty({
    description: "Note ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  orderId: string;

  @ApiProperty({
    description: "Note content",
    example: "Customer requested expedited shipping",
  })
  note: string;

  @ApiProperty({
    description: "Whether note is customer-visible",
    example: false,
  })
  isPublic: boolean;

  @ApiProperty({
    description: "Author ID (admin user ID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    nullable: true,
  })
  authorId: string | null;

  @ApiProperty({
    description: "Author name",
    example: "John Admin",
    nullable: true,
  })
  authorName: string | null;

  @ApiProperty({
    description: "Author email",
    example: "admin@example.com",
    nullable: true,
  })
  authorEmail: string | null;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-11-26T00:00:00.000Z",
  })
  updatedAt: Date;
}
