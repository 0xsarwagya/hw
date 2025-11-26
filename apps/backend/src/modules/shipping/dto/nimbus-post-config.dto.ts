import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class NimbusPostConfigDto {
  @ApiProperty({
    description: "Nimbus Post API key",
    example: "np_api_key_123456789",
  })
  @IsString({ message: "API key must be a string" })
  @IsNotEmpty({ message: "API key is required" })
  apiKey: string;

  @ApiProperty({
    description: "Nimbus Post API secret",
    example: "np_api_secret_987654321",
  })
  @IsString({ message: "API secret must be a string" })
  @IsNotEmpty({ message: "API secret is required" })
  apiSecret: string;

  @ApiProperty({
    description: "Nimbus Post API base URL (optional)",
    example: "https://api.nimbuspost.com/v1",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Base URL must be a string" })
  baseUrl?: string;
}

export class NimbusPostConfigResponseDto {
  @ApiProperty({
    description: "Indicates if Nimbus Post is initialized",
    example: true,
  })
  initialized: boolean;

  @ApiProperty({
    description: "A message regarding the initialization status",
    example: "Nimbus Post initialized successfully",
  })
  message: string;
}

export class NimbusPostConnectionTestResponseDto {
  @ApiProperty({
    description: "Indicates if connection test was successful",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Connection test message",
    example: "Nimbus Post API connection successful",
  })
  message: string;

  @ApiProperty({
    description: "Indicates if authentication was successful",
    example: true,
  })
  authenticated: boolean;
}
