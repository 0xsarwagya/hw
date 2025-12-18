import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class AdminLoginDto {
  @ApiProperty({
    description: "Admin email address",
    example: "admin@vcecom.local",
    type: String,
  })
  @IsNotEmpty({ message: "Email is required" })
  @IsString({ message: "Email must be a string" })
  email: string;

  @ApiProperty({
    description: "Admin password",
    example: "Admin@123",
    type: String,
    minLength: 8,
  })
  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;

  @ApiProperty({
    description: "Unique client-generated device ID",
    example: "web-browser-12345",
    type: String,
  })
  @IsNotEmpty({ message: "Device ID is required" })
  @IsString({ message: "Device ID must be a string" })
  deviceId: string;
}
