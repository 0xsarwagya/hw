import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CheckServiceabilityDto {
  @ApiProperty({
    description: "PIN code to check serviceability for",
    example: "110001",
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: "PIN code must be exactly 6 digits" })
  pincode: string;
}

export class ServiceabilityResponseDto {
  @ApiProperty({
    description: "Whether the PIN code format is valid",
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: "Whether the PIN code is serviceable",
    example: true,
  })
  isServiceable: boolean;

  @ApiProperty({
    description: "Whether COD is available for this PIN code",
    example: true,
  })
  codAvailable: boolean;

  @ApiProperty({
    description: "Shipping zone for this PIN code",
    example: "metro",
    enum: ["metro", "zone_a", "zone_b", "zone_c", "zone_d", "zone_e"],
  })
  shippingZone: string;

  @ApiProperty({
    description: "State name",
    example: "Delhi",
    required: false,
  })
  state?: string;

  @ApiProperty({
    description: "District name",
    example: "New Delhi",
    required: false,
  })
  district?: string;

  @ApiProperty({
    description: "City name",
    example: "New Delhi",
    required: false,
  })
  city?: string;

  @ApiProperty({
    description: "Error message if validation failed",
    example: "Invalid PIN code format",
    required: false,
  })
  error?: string;
}

export class BulkCheckServiceabilityDto {
  @ApiProperty({
    description: "Array of PIN codes to check",
    example: ["110001", "400001", "560001"],
    type: [String],
  })
  @IsNotEmpty()
  pincodes: string[];
}

export class BulkServiceabilityResponseDto {
  @ApiProperty({
    description: "Map of PIN codes to their serviceability results",
    type: "object",
    additionalProperties: {
      $ref: "#/components/schemas/ServiceabilityResponseDto",
    },
  })
  results: Record<string, ServiceabilityResponseDto>;
}
