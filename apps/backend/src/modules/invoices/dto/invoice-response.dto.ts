import { ApiProperty } from "@nestjs/swagger";

export class InvoiceResponseDto {
  @ApiProperty({
    description: "Invoice ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Unique invoice number",
    example: "INV-2025-000001",
  })
  invoiceNumber: string;

  @ApiProperty({
    description: "Order ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  orderId: string;

  @ApiProperty({
    description: "Path to PDF file",
    example: "/invoices/2025/11/INV-2025-000001.pdf",
  })
  pdfPath: string;

  @ApiProperty({
    description: "Invoice download URL",
    example: "/api/invoices/123e4567-e89b-12d3-a456-426614174000/download",
  })
  downloadUrl: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-11-28T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-11-28T00:00:00.000Z",
  })
  updatedAt: Date;
}
