import { ApiProperty } from "@nestjs/swagger";

export class PickupLocationDto {
  @ApiProperty({
    description: "Pickup location ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "Pickup location name",
    example: "Mumbai Warehouse",
  })
  name: string;

  @ApiProperty({
    description: "PIN code",
    example: "400001",
  })
  pincode: string;

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
    description: "Country",
    example: "India",
  })
  country: string;

  @ApiProperty({
    description: "Full address",
    example: "123 Warehouse Street, Andheri",
  })
  address: string;

  @ApiProperty({
    description: "Contact phone",
    example: "+919876543210",
  })
  phone: string;

  @ApiProperty({
    description: "Contact email",
    example: "warehouse@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Whether this is the default pickup location",
    example: true,
  })
  isDefault: boolean;
}
