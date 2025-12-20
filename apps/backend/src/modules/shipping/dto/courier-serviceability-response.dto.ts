import { ApiProperty } from "@nestjs/swagger";
import { CourierRateDto } from "./calculate-rates.dto";

export class CourierServiceabilityResponseDto {
  @ApiProperty({
    description: "Available courier rates",
    type: [CourierRateDto],
  })
  couriers: CourierRateDto[];
}

