import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { validateGstin } from "../utils/gstin.utils";

@ValidatorConstraint({ name: "isGstin", async: false })
export class IsGstinConstraint implements ValidatorConstraintInterface {
  validate(gstin: string, args: ValidationArguments): boolean {
    if (!gstin || typeof gstin !== "string") {
      return false;
    }
    return validateGstin(gstin);
  }

  defaultMessage(args: ValidationArguments): string {
    return "GSTIN must be a valid 15-character GST Identification Number with correct format and checksum";
  }
}

/**
 * Custom validator decorator for GSTIN validation
 * Validates GSTIN format, structure, and checksum
 * @param validationOptions - Optional validation options
 */
export function IsGstin(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsGstinConstraint,
    });
  };
}
