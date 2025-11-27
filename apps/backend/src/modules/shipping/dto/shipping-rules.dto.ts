import { ApiProperty } from "@nestjs/swagger";

export class ShippingRuleDto {
  @ApiProperty({
    description: "Unique identifier for the shipping rule",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  @ApiProperty({
    description: "Name of the shipping rule",
    example: "Metro Zone Base Rate",
  })
  name: string;

  @ApiProperty({
    description: "Type of shipping rule",
    example: "zone_based",
    enum: ["weight_based", "distance_based", "zone_based", "state_based"],
  })
  type: string;

  @ApiProperty({
    description: "Shipping zone this rule applies to",
    example: "metro",
    required: false,
  })
  zone?: string;

  @ApiProperty({
    description: "State this rule applies to",
    example: "Maharashtra",
    required: false,
  })
  state?: string;

  @ApiProperty({
    description: "Minimum weight in grams",
    example: 0,
    required: false,
  })
  minWeight?: number;

  @ApiProperty({
    description: "Maximum weight in grams",
    example: 1000,
    required: false,
  })
  maxWeight?: number;

  @ApiProperty({
    description: "Base shipping rate",
    example: 50,
  })
  baseRate: number;

  @ApiProperty({
    description: "Additional rate per unit",
    example: 10,
    required: false,
  })
  additionalRate?: number;

  @ApiProperty({
    description: "COD handling charge",
    example: 30,
    required: false,
  })
  codCharge?: number;

  @ApiProperty({
    description: "Allowed payment methods",
    example: "both",
    enum: ["prepaid", "cod", "both"],
  })
  paymentMethods: string;

  @ApiProperty({
    description: "Whether this rule is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Priority of this rule (higher values override lower ones)",
    example: 10,
  })
  priority: number;

  @ApiProperty({
    description: "Complex conditions as JSON string",
    example: '{"minOrderValue": 500}',
    required: false,
  })
  conditions?: string;
}

export class ShippingZoneRateDto {
  @ApiProperty({
    description: "Unique identifier for the zone rate",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  id: string;

  @ApiProperty({
    description: "Shipping zone",
    example: "metro",
  })
  zone: string;

  @ApiProperty({
    description: "Minimum weight in grams",
    example: 0,
  })
  minWeight: number;

  @ApiProperty({
    description: "Maximum weight in grams",
    example: 1000,
    required: false,
  })
  maxWeight?: number;

  @ApiProperty({
    description: "Base shipping rate",
    example: 50,
  })
  baseRate: number;

  @ApiProperty({
    description: "Additional rate per kg",
    example: 20,
    required: false,
  })
  additionalPerKg?: number;

  @ApiProperty({
    description: "Estimated delivery days",
    example: 2,
  })
  estimatedDays: number;

  @ApiProperty({
    description: "Whether COD is available in this zone",
    example: true,
  })
  codAvailable: boolean;

  @ApiProperty({
    description: "COD handling charge",
    example: 30,
    required: false,
  })
  codCharge?: number;

  @ApiProperty({
    description: "Whether this rate is active",
    example: true,
  })
  isActive: boolean;
}

export class StateShippingRuleDto {
  @ApiProperty({
    description: "Unique identifier for the state rule",
    example: "550e8400-e29b-41d4-a716-446655440002",
  })
  id: string;

  @ApiProperty({
    description: "State name",
    example: "Maharashtra",
  })
  state: string;

  @ApiProperty({
    description: "State code",
    example: "MH",
  })
  stateCode: string;

  @ApiProperty({
    description: "Whether COD is available in this state",
    example: true,
  })
  codAvailable: boolean;

  @ApiProperty({
    description: "State-specific COD charge",
    example: 25,
    required: false,
  })
  codCharge?: number;

  @ApiProperty({
    description: "Whether special handling is required",
    example: false,
  })
  specialHandling: boolean;

  @ApiProperty({
    description: "Restricted items as JSON array",
    example: '["liquor", "tobacco"]',
    required: false,
  })
  restrictedItems?: string;

  @ApiProperty({
    description: "Additional delivery days for this state",
    example: 1,
  })
  additionalDays: number;

  @ApiProperty({
    description: "Whether this rule is active",
    example: true,
  })
  isActive: boolean;
}
