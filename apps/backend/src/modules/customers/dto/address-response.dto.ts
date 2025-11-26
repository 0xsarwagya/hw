import { ApiProperty } from "@nestjs/swagger";

export class AddressResponseDto {
  @ApiProperty({
    description: "Address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Customer ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  customerId: string;

  @ApiProperty({
    description: "Address type",
    example: "shipping",
    enum: ["shipping", "billing", "both"],
  })
  type: "shipping" | "billing" | "both";

  @ApiProperty({
    description: "Street address",
    example: "123 Main Street, Apartment 4B",
  })
  street: string;

  @ApiProperty({
    description: "City",
    example: "Mumbai",
  })
  city: string;

  @ApiProperty({
    description: "State",
    example: "Maharashtra",
  })
  state: string;

  @ApiProperty({
    description: "PIN code",
    example: "400001",
  })
  pincode: string;

  @ApiProperty({
    description: "District",
    example: "Mumbai",
    nullable: true,
  })
  district: string | null;

  @ApiProperty({
    description: "Country",
    example: "India",
  })
  country: string;

  @ApiProperty({
    description: "Is default address",
    example: false,
  })
  isDefault: boolean;

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
