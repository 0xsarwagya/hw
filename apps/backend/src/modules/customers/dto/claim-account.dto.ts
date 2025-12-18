import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class ClaimAccountDto {
  @ApiProperty({
    description: "Email address of the guest customer",
    example: "customer@example.com",
  })
  @IsEmail({}, { message: "Email must be a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({
    description: "Verification token sent to email",
    example: "abc123xyz",
  })
  @IsString({ message: "Token must be a string" })
  @IsNotEmpty({ message: "Token is required" })
  token: string;

  @ApiProperty({
    description: "New password for the account (minimum 8 characters)",
    example: "SecurePassword123!",
    minLength: 8,
  })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  newPassword: string;
}
