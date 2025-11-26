import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ShiprocketConfigDto {
  @ApiProperty({
    description: "Shiprocket API email",
    example: "api@example.com",
  })
  @IsEmail({}, { message: "Email must be a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({
    description: "Shiprocket API password",
    example: "your-api-password",
  })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  password: string;

  @ApiProperty({
    description: "Shiprocket API base URL (optional)",
    example: "https://apiv2.shiprocket.in/v1/external",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Base URL must be a string" })
  baseUrl?: string;
}

export class ShiprocketConfigResponseDto {
  @ApiProperty({
    description: "Indicates if Shiprocket is initialized",
    example: true,
  })
  initialized: boolean;

  @ApiProperty({
    description: "A message regarding the initialization status",
    example: "Shiprocket initialized successfully",
  })
  message: string;
}

export class ShiprocketConnectionTestResponseDto {
  @ApiProperty({
    description: "Indicates if connection test was successful",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Connection test message",
    example: "Shiprocket API connection successful",
  })
  message: string;

  @ApiProperty({
    description: "Indicates if authentication was successful",
    example: true,
  })
  authenticated: boolean;
}
