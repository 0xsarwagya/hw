import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class GenerateSecretResponseDto {
  @ApiProperty({
    description: "The TOTP secret key",
    example: "JBSWY3DPEHPK3PXP",
  })
  @IsString()
  secret: string;

  @ApiProperty({
    description: "QR code image data URL for authenticator app setup",
    example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
  })
  @IsString()
  qrCode: string;
}

export class Enable2FADto {
  @ApiProperty({
    description: "The TOTP code from the authenticator app",
    example: "123456",
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class Enable2FAResponseDto {
  @ApiProperty({
    description: "List of backup codes (save these securely!)",
    example: ["ABCDEFGH", "IJKLMNOP"],
  })
  @IsArray()
  @IsString({ each: true })
  backupCodes: string[];
}

export class Disable2FADto {
  @ApiProperty({
    description: "The TOTP code or one of the backup codes",
    example: "123456",
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class Verify2FADto {
  @ApiProperty({
    description: "The TOTP code or one of the backup codes",
    example: "123456",
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}
