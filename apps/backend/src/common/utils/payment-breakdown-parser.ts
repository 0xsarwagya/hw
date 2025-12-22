import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../logging/context.service";
import { createLogContext } from "../logging/logging.helper";

export interface PaymentFeeBreakdown {
  method: string;
  chargeType: string;
  calculatedFee: number;
  flatAmount?: number;
  percentage?: number;
  mixMin?: number;
  mixCap?: number;
}

/**
 * Safely parse payment fee breakdown from order or metadata
 * Returns null if parsing fails or structure is invalid
 */
export function parsePaymentFeeBreakdown(
  paymentFeeBreakdown: unknown,
  logger: PinoLogger,
  contextService: ContextService,
  context: {
    operation: string;
    orderId?: string;
    metadata?: Record<string, unknown>;
  },
): PaymentFeeBreakdown | null {
  if (!paymentFeeBreakdown) {
    return null;
  }

  try {
    const parsed =
      typeof paymentFeeBreakdown === "string"
        ? JSON.parse(paymentFeeBreakdown)
        : paymentFeeBreakdown;

    // Validate structure
    if (
      parsed &&
      typeof parsed === "object" &&
      "method" in parsed &&
      "chargeType" in parsed &&
      "calculatedFee" in parsed &&
      typeof parsed.method === "string" &&
      typeof parsed.chargeType === "string" &&
      typeof parsed.calculatedFee === "number"
    ) {
      return parsed as PaymentFeeBreakdown;
    } else {
      logger.warn(
        createLogContext(contextService, context.operation, {
          ...context.metadata,
          orderId: context.orderId,
          paymentFeeBreakdown: JSON.stringify(paymentFeeBreakdown),
        }),
        "Invalid payment fee breakdown structure",
      );
      return null;
    }
  } catch (error) {
    logger.warn(
      createLogContext(contextService, context.operation, {
        ...context.metadata,
        orderId: context.orderId,
        error: error instanceof Error ? error.message : String(error),
      }),
      "Failed to parse payment fee breakdown",
    );
    return null;
  }
}
