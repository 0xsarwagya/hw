import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "minMaxQuantity", async: false })
class MinMaxQuantityConstraint implements ValidatorConstraintInterface {
  validate(maxQuantity: number, args: ValidationArguments) {
    const obj = args.object as CreateBundleSetDto;
    return obj.minQuantity <= maxQuantity;
  }

  defaultMessage(args: ValidationArguments) {
    return "maxQuantity must be greater than or equal to minQuantity";
  }
}

export class CreateBundleSetDto {
  @ApiProperty({
    description: "Set title",
    example: "Choose your T-shirt",
    required: true,
  })
  @IsString({ message: "Title must be a string" })
  title: string;

  @ApiProperty({
    description: "Set description",
    example: "Select one T-shirt from the options",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @ApiProperty({
    description: "Minimum quantity required (required picks)",
    example: 1,
    required: true,
  })
  @Type(() => Number)
  @IsInt({ message: "Min quantity must be an integer" })
  @Min(0, { message: "Min quantity must be at least 0" })
  @Max(15, { message: "Min quantity must be at most 15" })
  minQuantity: number;

  @ApiProperty({
    description: "Maximum quantity allowed (allowed picks)",
    example: 1,
    required: true,
  })
  @Type(() => Number)
  @IsInt({ message: "Max quantity must be an integer" })
  @Min(1, { message: "Max quantity must be at least 1" })
  @Max(15, { message: "Max quantity must be at most 15" })
  @Validate(MinMaxQuantityConstraint)
  maxQuantity: number;
}
