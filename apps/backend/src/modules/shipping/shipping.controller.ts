import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  CalculateRatesDto,
  CalculateRatesResponseDto,
} from "./dto/calculate-rates.dto";
import {
  CalculateShippingRateDto,
  ShippingCalculationResponseDto,
} from "./dto/calculate-shipping-rate.dto";
import { CancelShipmentResponseDto } from "./dto/cancel-shipment.dto";
import {
  BulkCheckServiceabilityDto,
  BulkServiceabilityResponseDto,
  CheckServiceabilityDto,
  ServiceabilityResponseDto,
} from "./dto/check-serviceability.dto";
import { CourierServiceabilityQueryDto } from "./dto/courier-serviceability-query.dto";
import { CourierServiceabilityResponseDto } from "./dto/courier-serviceability-response.dto";
import {
  GenerateLabelDto,
  GenerateLabelResponseDto,
} from "./dto/generate-label.dto";
import {
  ListShipmentsQueryDto,
  PaginatedShipmentsResponseDto,
} from "./dto/list-shipments.dto";
import {
  NimbusPostConfigDto,
  NimbusPostConfigResponseDto,
  NimbusPostConnectionTestResponseDto,
} from "./dto/nimbus-post-config.dto";
import { PickupLocationDto } from "./dto/pickup-location.dto";
import { ShipmentResponseDto } from "./dto/shipment-response.dto";
import {
  ShippingRuleDto,
  ShippingZoneRateDto,
  StateShippingRuleDto,
} from "./dto/shipping-rules.dto";
import {
  ShiprocketConfigDto,
  ShiprocketConfigResponseDto,
  ShiprocketConnectionTestResponseDto,
} from "./dto/shiprocket-config.dto";
import { TrackShipmentResponseDto } from "./dto/track-shipment.dto";
import { NimbusPostService } from "./nimbus-post.service";
import { ShipmentsService } from "./services/shipments.service";
import { ShippingRulesService } from "./shipping-rules.service";
import { ShiprocketService } from "./shiprocket.service";

@ApiTags("admin")
@Controller("admin/shipping")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class ShippingController {
  constructor(
    private readonly shiprocketService: ShiprocketService,
    private readonly nimbusPostService: NimbusPostService,
    private readonly shippingRulesService: ShippingRulesService,
    private readonly shipmentsService: ShipmentsService,
  ) {}

  @Get("shiprocket/status")
  @Roles("admin")
  @ApiOperation({
    summary: "Get Shiprocket initialization status",
    description:
      "Returns the current initialization status of Shiprocket. Only accessible by admin users.",
  })
  @ApiResponse({
    status: 200,
    description: "Shiprocket initialization status",
    schema: {
      type: "object",
      properties: {
        initialized: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example: "Shiprocket is initialized",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  getShiprocketStatus() {
    const isInitialized = this.shiprocketService.isInitialized();
    return {
      initialized: isInitialized,
      message: isInitialized
        ? "Shiprocket is initialized"
        : "Shiprocket is not initialized",
    };
  }

  @Post("shiprocket/initialize")
  @Roles("admin")
  @ApiOperation({
    summary: "Initialize Shiprocket with API credentials",
    description:
      "Initializes Shiprocket with the provided API credentials. Only accessible by admin users. This endpoint allows manual initialization of Shiprocket if environment variables are not set.",
  })
  @ApiResponse({
    status: 201,
    description: "Shiprocket initialized successfully",
    type: ShiprocketConfigResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid configuration",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async initializeShiprocket(
    @Body() configDto: ShiprocketConfigDto,
  ): Promise<ShiprocketConfigResponseDto> {
    await this.shiprocketService.initialize(
      configDto.email,
      configDto.password,
    );
    return {
      initialized: true,
      message: "Shiprocket initialized successfully",
    };
  }

  @Post("shiprocket/test-connection")
  @Roles("admin")
  @ApiOperation({
    summary: "Test Shiprocket API connection",
    description:
      "Tests the connection to Shiprocket API by attempting authentication. Only accessible by admin users.",
  })
  @ApiResponse({
    status: 200,
    description: "Connection test result",
    type: ShiprocketConnectionTestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async testConnection(): Promise<ShiprocketConnectionTestResponseDto> {
    return this.shiprocketService.testConnection();
  }

  @Post("calculate")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Calculate shipping rates",
    description:
      "Calculates shipping rates for a given pickup and delivery PIN code. Returns multiple courier options with rates, COD charges, and estimated delivery times. Accessible by both admin and customer users.",
  })
  @ApiResponse({
    status: 200,
    description: "Shipping rates calculated successfully",
    type: CalculateRatesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input parameters",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 500,
    description:
      "Internal server error - Shiprocket not initialized or API error",
  })
  async calculateRates(
    @Body() calculateRatesDto: CalculateRatesDto,
  ): Promise<CalculateRatesResponseDto> {
    return this.shiprocketService.calculateRates(
      calculateRatesDto.pickupPincode,
      calculateRatesDto.deliveryPincode,
      calculateRatesDto.weight,
      calculateRatesDto.orderValue,
      calculateRatesDto.codAmount,
    );
  }

  @Post("generate-label")
  @Roles("admin")
  @ApiOperation({
    summary: "Generate shipping label for an order",
    description:
      "Creates a shipment in Shiprocket and generates a shipping label (PDF) for the specified order. Only accessible by admin users. This will create the shipment, assign an AWB number, and generate the label.",
  })
  @ApiResponse({
    status: 201,
    description: "Label generated successfully",
    type: GenerateLabelResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid order or courier ID",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({
    status: 404,
    description: "Order not found",
  })
  @ApiResponse({
    status: 500,
    description:
      "Internal server error - Shiprocket not initialized or API error",
  })
  async generateLabel(
    @Body() generateLabelDto: GenerateLabelDto,
  ): Promise<GenerateLabelResponseDto> {
    return this.shiprocketService.createShipment(
      generateLabelDto.orderId,
      generateLabelDto.courierId,
      generateLabelDto.pickupPincode,
      generateLabelDto.weight,
    );
  }

  @Get("track/:trackingNumber")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Track shipment by tracking number",
    description:
      "Retrieves tracking information for a shipment using the AWB/tracking number. Returns current status, estimated delivery date, and a timeline of tracking events. Accessible by both admin and customer users.",
  })
  @ApiResponse({
    status: 200,
    description: "Tracking information retrieved successfully",
    type: TrackShipmentResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    description: "Shipment not found",
  })
  @ApiResponse({
    status: 500,
    description:
      "Internal server error - Shiprocket not initialized or API error",
  })
  async trackShipment(
    @Param("trackingNumber") trackingNumber: string,
  ): Promise<TrackShipmentResponseDto> {
    return this.shiprocketService.trackShipment(trackingNumber);
  }

  @Get("nimbus-post/status")
  @Roles("admin")
  @ApiOperation({
    summary: "Get Nimbus Post initialization status",
    description:
      "Returns the current initialization status of Nimbus Post. Only accessible by admin users.",
  })
  @ApiResponse({
    status: 200,
    description: "Nimbus Post initialization status",
    schema: {
      type: "object",
      properties: {
        initialized: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example: "Nimbus Post is initialized",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  getNimbusPostStatus() {
    const isInitialized = this.nimbusPostService.isInitialized();
    return {
      initialized: isInitialized,
      message: isInitialized
        ? "Nimbus Post is initialized"
        : "Nimbus Post is not initialized",
    };
  }

  @Post("nimbus-post/initialize")
  @Roles("admin")
  @ApiOperation({
    summary: "Initialize Nimbus Post with API credentials",
    description:
      "Initializes Nimbus Post with the provided API credentials. Only accessible by admin users. This endpoint allows manual initialization of Nimbus Post if environment variables are not set.",
  })
  @ApiResponse({
    status: 201,
    description: "Nimbus Post initialized successfully",
    type: NimbusPostConfigResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid configuration",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async initializeNimbusPost(
    @Body() configDto: NimbusPostConfigDto,
  ): Promise<NimbusPostConfigResponseDto> {
    await this.nimbusPostService.initialize(
      configDto.apiKey,
      configDto.apiSecret,
    );
    return {
      initialized: true,
      message: "Nimbus Post initialized successfully",
    };
  }

  @Post("nimbus-post/test-connection")
  @Roles("admin")
  @ApiOperation({
    summary: "Test Nimbus Post API connection",
    description:
      "Tests the connection to Nimbus Post API by attempting authentication. Only accessible by admin users.",
  })
  @ApiResponse({
    status: 200,
    description: "Connection test result",
    type: NimbusPostConnectionTestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async testNimbusPostConnection(): Promise<NimbusPostConnectionTestResponseDto> {
    return this.nimbusPostService.testConnection();
  }

  // PIN Code Serviceability Endpoints

  @Post("check-serviceability")
  @ApiOperation({
    summary: "Check PIN code serviceability",
    description:
      "Checks if a PIN code is serviceable and returns shipping details including COD availability and zone information.",
  })
  @ApiResponse({
    status: 200,
    description: "Serviceability check result",
    type: ServiceabilityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid PIN code format",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async checkServiceability(
    @Body() dto: CheckServiceabilityDto,
  ): Promise<ServiceabilityResponseDto> {
    return this.shippingRulesService.checkServiceability(dto.pincode);
  }

  @Post("check-serviceability/bulk")
  @ApiOperation({
    summary: "Bulk check PIN code serviceability",
    description:
      "Checks serviceability for multiple PIN codes in a single request.",
  })
  @ApiResponse({
    status: 200,
    description: "Bulk serviceability check results",
    type: BulkServiceabilityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid PIN codes",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async checkBulkServiceability(
    @Body() dto: BulkCheckServiceabilityDto,
  ): Promise<BulkServiceabilityResponseDto> {
    const results = await this.shippingRulesService.checkBulkServiceability(
      dto.pincodes,
    );
    return { results: Object.fromEntries(results) };
  }

  @Post("calculate-rate")
  @ApiOperation({
    summary: "Calculate shipping rate",
    description:
      "Calculates shipping rate based on PIN code, weight, and COD requirements.",
  })
  @ApiResponse({
    status: 200,
    description: "Shipping rate calculation result",
    type: ShippingCalculationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input or non-serviceable PIN code",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async calculateShippingRate(
    @Body() dto: CalculateShippingRateDto,
  ): Promise<ShippingCalculationResponseDto> {
    return this.shippingRulesService.calculateShippingRate({
      pincode: dto.pincode,
      weight: dto.weight,
      isCod: dto.isCod || false,
    });
  }

  // Shipping Rules Management Endpoints (Admin only)

  @Get("rules")
  @Roles("admin")
  @ApiOperation({
    summary: "Get all shipping rules",
    description: "Retrieves all active shipping rules. Admin access required.",
  })
  @ApiResponse({
    status: 200,
    description: "List of shipping rules",
    type: [ShippingRuleDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getShippingRules(): Promise<ShippingRuleDto[]> {
    return this.shippingRulesService.getShippingRules();
  }

  @Get("zone-rates")
  @Roles("admin")
  @ApiOperation({
    summary: "Get shipping zone rates",
    description:
      "Retrieves all active shipping zone rates. Admin access required.",
  })
  @ApiResponse({
    status: 200,
    description: "List of shipping zone rates",
    type: [ShippingZoneRateDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getShippingZoneRates(): Promise<ShippingZoneRateDto[]> {
    return this.shippingRulesService.getShippingZoneRates();
  }

  @Get("state-rules")
  @Roles("admin")
  @ApiOperation({
    summary: "Get state shipping rules",
    description:
      "Retrieves all active state shipping rules. Admin access required.",
  })
  @ApiResponse({
    status: 200,
    description: "List of state shipping rules",
    type: [StateShippingRuleDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getStateShippingRules(): Promise<StateShippingRuleDto[]> {
    return this.shippingRulesService.getStateShippingRules();
  }

  @Get("shiprocket/pickup-locations")
  @Roles("admin")
  @ApiOperation({
    summary: "Get Shiprocket pickup locations",
    description:
      "Retrieves all available pickup locations from Shiprocket. Admin-only endpoint.",
  })
  @ApiResponse({
    status: 200,
    description: "Pickup locations retrieved successfully",
    type: [PickupLocationDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({
    status: 500,
    description:
      "Internal server error - Shiprocket not initialized or API error",
  })
  async getPickupLocations(): Promise<PickupLocationDto[]> {
    return this.shiprocketService.getPickupLocations();
  }

  @Get("shiprocket/courier-serviceability")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Get courier serviceability (GET version)",
    description:
      "Checks which couriers can service a route. Returns available couriers with rates. Accessible by both admin and customer users.",
  })
  @ApiResponse({
    status: 200,
    description: "Courier serviceability retrieved successfully",
    type: CourierServiceabilityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input parameters",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 500,
    description:
      "Internal server error - Shiprocket not initialized or API error",
  })
  async getCourierServiceability(
    @Query() query: CourierServiceabilityQueryDto,
  ): Promise<CourierServiceabilityResponseDto> {
    const couriers = await this.shiprocketService.getCourierServiceability(
      query.pickupPincode,
      query.deliveryPincode,
      query.weight,
      query.orderValue,
      query.codAmount,
    );

    return { couriers };
  }

  @Post("shiprocket/cancel/:awb")
  @Roles("admin")
  @ApiOperation({
    summary: "Cancel shipment (admin)",
    description:
      "Cancels a shipment in Shiprocket and updates the database. Admin-only endpoint.",
  })
  @ApiParam({
    name: "awb",
    description: "AWB (Airway Bill) number",
    example: "AWB123456789",
  })
  @ApiResponse({
    status: 200,
    description: "Shipment cancelled successfully",
    type: CancelShipmentResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({
    status: 404,
    description: "Shipment not found",
  })
  @ApiResponse({
    status: 500,
    description:
      "Internal server error - Shiprocket not initialized or API error",
  })
  async cancelShipment(
    @Param("awb") awbNumber: string,
  ): Promise<CancelShipmentResponseDto> {
    return this.shiprocketService.cancelShipment(awbNumber);
  }

  @Get("shipments")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "List shipments",
    description:
      "Retrieve a paginated list of shipments with optional filters. Accessible by both admin and customer users.",
  })
  @ApiResponse({
    status: 200,
    description: "List of shipments retrieved successfully",
    type: PaginatedShipmentsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async listShipments(
    @Query() query: ListShipmentsQueryDto,
  ): Promise<PaginatedShipmentsResponseDto> {
    const filters = {
      orderId: query.orderId,
      status: query.status,
      provider: query.provider,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    };

    return this.shipmentsService.findAll(filters);
  }

  @Get("shipments/:id")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Get shipment by ID",
    description:
      "Retrieve a single shipment by ID. Accessible by both admin and customer users.",
  })
  @ApiParam({
    name: "id",
    description: "Shipment ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Shipment retrieved successfully",
    type: ShipmentResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    description: "Shipment not found",
  })
  async getShipment(@Param("id") id: string): Promise<ShipmentResponseDto> {
    return this.shipmentsService.findOne(id);
  }
}
