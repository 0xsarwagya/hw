import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Response,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthService } from "./auth.service";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { UserProfileDto } from "./dto/user-profile.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register a new user",
    description:
      "Create a new user account with email and password. Returns access token and refresh token.",
  })
  @ApiCreatedResponse({
    description: "User successfully registered",
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid input or user already exists",
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.role,
    );
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login user",
    description:
      "Authenticate user with email and password, receive JWT access token and refresh token in httpOnly cookies",
  })
  @ApiOkResponse({
    description: "User successfully authenticated",
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials",
  })
  @ApiBadRequestResponse({
    description: "Invalid input",
  })
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: any,
  ): Promise<AuthResponseDto> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    const tokens = await this.authService.login(user);

    // Set httpOnly cookies
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    };

    res.cookie("admin_access_token", tokens.access_token, cookieOptions);
    res.cookie("admin_refresh_token", tokens.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return tokens;
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description:
      "Get a new access token and refresh token using a valid refresh token",
  })
  @ApiOkResponse({
    description: "Tokens successfully refreshed",
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or expired refresh token",
  })
  @ApiBadRequestResponse({
    description: "Invalid input",
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: any,
    @Response({ passthrough: true }) res: any,
  ): Promise<AuthResponseDto> {
    // Try to get refresh token from cookie first, then from body
    const refreshToken =
      req.cookies?.admin_refresh_token || refreshTokenDto.refresh_token;
    const tokens = await this.authService.refreshToken(refreshToken);

    // Update cookies
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    };

    res.cookie("admin_access_token", tokens.access_token, cookieOptions);
    res.cookie("admin_refresh_token", tokens.refresh_token, cookieOptions);

    return tokens;
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Logout user",
    description: "Clear authentication cookies",
  })
  @ApiOkResponse({
    description: "Successfully logged out",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Logged out successfully",
        },
      },
    },
  })
  async logout(@Response({ passthrough: true }) res: any) {
    res.clearCookie("admin_access_token", { path: "/" });
    res.clearCookie("admin_refresh_token", { path: "/" });
    return { message: "Logged out successfully" };
  }

  @Get("profile")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get current user profile",
    description: "Get the profile of the currently authenticated user",
  })
  @ApiOkResponse({
    description: "User profile retrieved successfully",
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  async getProfile(@Request() req): Promise<UserProfileDto> {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }

  @Get("admin-only")
  @Roles("admin")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Admin-only endpoint",
    description: "This endpoint is only accessible to users with admin role",
  })
  @ApiOkResponse({
    description: "Admin access granted",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Welcome, admin!",
        },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  @ApiForbiddenResponse({
    description: "Access denied. Admin role required.",
  })
  async adminOnly(@Request() req) {
    return {
      message: "Welcome, admin!",
      user: req.user,
    };
  }

  @Get("customer-only")
  @Roles("customer")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Customer-only endpoint",
    description: "This endpoint is only accessible to users with customer role",
  })
  @ApiOkResponse({
    description: "Customer access granted",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Welcome, customer!",
        },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required",
  })
  @ApiForbiddenResponse({
    description: "Access denied. Customer role required.",
  })
  async customerOnly(@Request() req) {
    return {
      message: "Welcome, customer!",
      user: req.user,
    };
  }
}
