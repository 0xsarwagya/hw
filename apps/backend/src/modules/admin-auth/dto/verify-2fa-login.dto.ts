import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class Verify2FALoginDto {
  @ApiProperty({
    description: "Admin email address",
    example: "admin@vcecom.local",
    type: String,
  })
  @IsNotEmpty({ message: "Email is required" })
  @IsString({ message: "Email must be a string" })
  email: string;

  @ApiProperty({
    description: "The TOTP code or one of the backup codes",
    example: "123456",
  })
  @IsNotEmpty({ message: "2FA code is required" })
  @IsString({ message: "2FA code must be a string" })
  code: string;

  @ApiProperty({
    description: "Unique client-generated device ID",
    example: "web-browser-12345",
    type: String,
  })
  @IsNotEmpty({ message: "Device ID is required" })
  @IsString({ message: "Device ID must be a string" })
  deviceId: string;
}
