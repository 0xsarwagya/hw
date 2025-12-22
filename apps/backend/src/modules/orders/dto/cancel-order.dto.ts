import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class CancelOrderDto {
  @ApiProperty({
    description: "Reason for cancellation",
    example: "Changed my mind",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Reason must not exceed 500 characters" })
  reason?: string;

  @ApiProperty({
    description: "Whether customer wants refund (for paid orders)",
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  refundRequested?: boolean;
}
