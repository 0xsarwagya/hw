import { ApiProperty } from "@nestjs/swagger";

export class StateSuggestionDto {
  @ApiProperty({
    description: "State name",
    example: "Maharashtra",
  })
  name: string;

  @ApiProperty({
    description: "State code",
    example: "MH",
  })
  code: string;

  @ApiProperty({
    description: "Number of districts in the state",
    example: 36,
  })
  districtCount: number;
}

export class DistrictSuggestionDto {
  @ApiProperty({
    description: "District name",
    example: "Mumbai",
  })
  name: string;

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
    description: "Number of pincodes in the district",
    example: 150,
  })
  pincodeCount: number;
}

export class StateAutocompleteResponseDto {
  @ApiProperty({
    description: "List of state suggestions",
    type: [StateSuggestionDto],
  })
  states: StateSuggestionDto[];

  @ApiProperty({
    description: "Total number of matching states",
    example: 5,
  })
  total: number;
}

export class DistrictAutocompleteResponseDto {
  @ApiProperty({
    description: "List of district suggestions",
    type: [DistrictSuggestionDto],
  })
  districts: DistrictSuggestionDto[];

  @ApiProperty({
    description: "Total number of matching districts",
    example: 10,
  })
  total: number;
}
