import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AddressAutocompleteService } from "./address-autocomplete.service";
import {
  DistrictAutocompleteQueryDto,
  StateAutocompleteQueryDto,
} from "./dto/autocomplete-query.dto";
import {
  DistrictAutocompleteResponseDto,
  DistrictSuggestionDto,
  StateAutocompleteResponseDto,
  StateSuggestionDto,
} from "./dto/autocomplete-response.dto";

@ApiTags("store")
@Controller("store/address-autocomplete")
export class AddressAutocompleteController {
  constructor(
    private readonly autocompleteService: AddressAutocompleteService,
  ) {}

  @Get("states")
  @ApiOperation({
    summary: "Get state suggestions",
    description:
      "Returns a list of Indian states matching the search query. " +
      "Useful for autocomplete functionality in address forms.",
  })
  @ApiQuery({
    name: "query",
    description: "Search query for state name (minimum 2 characters)",
    example: "Mah",
    required: true,
  })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of results to return",
    example: 10,
    required: false,
  })
  async getStateSuggestions(
    @Query() queryDto: StateAutocompleteQueryDto,
  ): Promise<StateAutocompleteResponseDto> {
    return this.autocompleteService.getStateSuggestions(queryDto);
  }

  @Get("states/all")
  @ApiOperation({
    summary: "Get all states",
    description:
      "Returns a complete list of all Indian states. " +
      "Useful for populating state dropdowns.",
  })
  async getAllStates(): Promise<StateSuggestionDto[]> {
    return this.autocompleteService.getAllStates();
  }

  @Get("districts")
  @ApiOperation({
    summary: "Get district suggestions",
    description:
      "Returns a list of districts matching the search query. " +
      "Optionally filter by state. Useful for autocomplete functionality in address forms.",
  })
  @ApiQuery({
    name: "query",
    description: "Search query for district name (minimum 2 characters)",
    example: "Mum",
    required: true,
  })
  @ApiQuery({
    name: "state",
    description: "State name to filter districts (optional)",
    example: "Maharashtra",
    required: false,
  })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of results to return",
    example: 10,
    required: false,
  })
  async getDistrictSuggestions(
    @Query() queryDto: DistrictAutocompleteQueryDto,
  ): Promise<DistrictAutocompleteResponseDto> {
    return this.autocompleteService.getDistrictSuggestions(queryDto);
  }

  @Get("districts/by-state")
  @ApiOperation({
    summary: "Get districts by state",
    description:
      "Returns all districts for a specific state. " +
      "Useful for populating district dropdowns after state selection.",
  })
  @ApiQuery({
    name: "state",
    description: "State name",
    example: "Maharashtra",
    required: true,
  })
  async getDistrictsByState(
    @Query("state") state: string,
  ): Promise<DistrictSuggestionDto[]> {
    return this.autocompleteService.getDistrictsByState(state);
  }
}
