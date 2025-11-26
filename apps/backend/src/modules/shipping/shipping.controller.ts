import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
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
  ShiprocketConfigDto,
  ShiprocketConfigResponseDto,
  ShiprocketConnectionTestResponseDto,
} from "./dto/shiprocket-config.dto";
import { ShiprocketService } from "./shiprocket.service";

@ApiTags("shipping")
@Controller("shipping")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class ShippingController {
  constructor(private readonly shiprocketService: ShiprocketService) {}

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
}
