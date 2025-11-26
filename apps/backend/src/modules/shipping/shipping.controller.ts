import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
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
  GenerateLabelDto,
  GenerateLabelResponseDto,
} from "./dto/generate-label.dto";
import {
  NimbusPostConfigDto,
  NimbusPostConfigResponseDto,
  NimbusPostConnectionTestResponseDto,
} from "./dto/nimbus-post-config.dto";
import {
  ShiprocketConfigDto,
  ShiprocketConfigResponseDto,
  ShiprocketConnectionTestResponseDto,
} from "./dto/shiprocket-config.dto";
import { TrackShipmentResponseDto } from "./dto/track-shipment.dto";
import { NimbusPostService } from "./nimbus-post.service";
import { ShiprocketService } from "./shiprocket.service";

@ApiTags("shipping")
@Controller("shipping")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class ShippingController {
  constructor(
    private readonly shiprocketService: ShiprocketService,
    private readonly nimbusPostService: NimbusPostService,
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
}
