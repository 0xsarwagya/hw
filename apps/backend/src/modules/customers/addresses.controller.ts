import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Request,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { AddressesService } from "./addresses.service";
import { AddressResponseDto } from "./dto/address-response.dto";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@ApiTags("customers")
@Controller("customers/addresses")
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @Roles("customer")
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Add a new address",
    description: "Add a new address for the currently authenticated customer",
  })
  @ApiCreatedResponse({
    description: "Address created successfully",
    type: AddressResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid input or invalid PIN code format",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async create(
    @Request() req,
    @Body() createDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressesService.create(req.user.id, createDto);
  }

  @Get()
  @Roles("customer")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "List all addresses",
    description: "Get all addresses for the currently authenticated customer",
  })
  @ApiOkResponse({
    description: "List of addresses",
    type: [AddressResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async findAll(@Request() req): Promise<AddressResponseDto[]> {
    return this.addressesService.findAll(req.user.id);
  }

  @Get(":id")
  @Roles("customer")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get address by ID",
    description:
      "Get a specific address by ID for the currently authenticated customer",
  })
  @ApiParam({
    name: "id",
    description: "Address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Address found",
    type: AddressResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Address not found",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async findOne(
    @Request() req,
    @Param("id") id: string,
  ): Promise<AddressResponseDto> {
    return this.addressesService.findOne(req.user.id, id);
  }

  @Put(":id")
  @Roles("customer")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update an address",
    description:
      "Update an existing address by ID for the currently authenticated customer",
  })
  @ApiParam({
    name: "id",
    description: "Address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Address updated successfully",
    type: AddressResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Address not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid input or invalid PIN code format",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressesService.update(req.user.id, id, updateDto);
  }

  @Delete(":id")
  @Roles("customer")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Delete an address",
    description:
      "Delete an existing address by ID for the currently authenticated customer",
  })
  @ApiParam({
    name: "id",
    description: "Address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Address deleted successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Address deleted successfully",
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Address not found",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async remove(@Request() req, @Param("id") id: string) {
    return this.addressesService.remove(req.user.id, id);
  }

  @Patch(":id/set-default")
  @Roles("customer")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Set address as default",
    description:
      "Set an address as the default address for the currently authenticated customer. This will unset other default addresses.",
  })
  @ApiParam({
    name: "id",
    description: "Address ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiOkResponse({
    description: "Address set as default successfully",
    type: AddressResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Address not found",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async setDefault(
    @Request() req,
    @Param("id") id: string,
  ): Promise<AddressResponseDto> {
    return this.addressesService.setDefault(req.user.id, id);
  }
}
