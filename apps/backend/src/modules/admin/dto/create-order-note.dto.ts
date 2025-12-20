import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateOrderNoteDto {
  @ApiProperty({
    description: "Note content",
    example: "Customer requested expedited shipping",
    maxLength: 2000,
  })
  @IsString({ message: "Note must be a string" })
  @IsNotEmpty({ message: "Note is required" })
  @MaxLength(2000, { message: "Note must not exceed 2000 characters" })
  note: string;

  @ApiProperty({
    description: "Whether note is customer-visible",
    example: false,
    default: false,
  })
  @IsBoolean({ message: "isPublic must be a boolean" })
  @IsOptional()
  isPublic?: boolean;
}
