import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsUUID } from "class-validator";

export enum BulkProductOperation {
  ACTIVATE = "activate",
  ARCHIVE = "archive",
  DELETE = "delete",
}

export class BulkProductOperationDto {
  @ApiProperty({
    description: "Array of product IDs to perform operation on",
    example: [
      "123e4567-e89b-12d3-a456-426614174000",
      "123e4567-e89b-12d3-a456-426614174001",
    ],
    type: [String],
  })
  @IsArray({ message: "Product IDs must be an array" })
  @IsUUID(4, { each: true, message: "Each product ID must be a valid UUID" })
  productIds: string[];

  @ApiProperty({
    description: "Operation to perform",
    enum: BulkProductOperation,
    example: "activate",
  })
  @IsEnum(BulkProductOperation, {
    message: "Operation must be one of: activate, archive, delete",
  })
  operation: BulkProductOperation;
}

export class BulkProductOperationResponseDto {
  @ApiProperty({
    description: "Number of products affected",
    example: 5,
  })
  affected: number;

  @ApiProperty({
    description: "Operation performed",
    example: "activate",
  })
  operation: string;

  @ApiProperty({
    description: "Success message",
    example: "Successfully activated 5 products",
  })
  message: string;
}
