import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from "class-validator";

export enum CollectionRuleField {
  PRICE = "price",
  TITLE = "title",
  TAGS = "tags",
  CATEGORY = "category",
  STATUS = "status",
  INVENTORY = "inventory",
}

export enum CollectionRuleOperator {
  EQUALS = "equals",
  NOT_EQUALS = "not_equals",
  LESS_THAN = "less_than",
  GREATER_THAN = "greater_than",
  CONTAINS = "contains",
}

export class CollectionRuleDto {
  @ApiProperty({
    description: "Field to filter on",
    enum: CollectionRuleField,
    example: CollectionRuleField.PRICE,
  })
  @IsNotEmpty({ message: "Field is required" })
  @IsEnum(CollectionRuleField, { message: "Invalid field" })
  field: CollectionRuleField;

  @ApiProperty({
    description: "Operator to apply",
    enum: CollectionRuleOperator,
    example: CollectionRuleOperator.GREATER_THAN,
  })
  @IsNotEmpty({ message: "Operator is required" })
  @IsEnum(CollectionRuleOperator, { message: "Invalid operator" })
  operator: CollectionRuleOperator;

  @ApiProperty({
    description: "Value to compare against",
    example: 100,
    oneOf: [{ type: "string" }, { type: "number" }],
  })
  @IsNotEmpty({ message: "Value is required" })
  @ValidateIf((o) => o.field === CollectionRuleField.PRICE)
  @IsNumber({}, { message: "Value must be a number for price field" })
  @ValidateIf((o) => o.field === CollectionRuleField.INVENTORY)
  @IsNumber({}, { message: "Value must be a number for inventory field" })
  @ValidateIf(
    (o) =>
      o.field !== CollectionRuleField.PRICE &&
      o.field !== CollectionRuleField.INVENTORY,
  )
  @IsString({ message: "Value must be a string for non-numeric fields" })
  value: string | number;
}
