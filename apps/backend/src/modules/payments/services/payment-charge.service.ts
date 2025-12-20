import { Injectable } from "@nestjs/common";
import { and, db, eq, PaymentMethod, paymentMethodCharges } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import {
  PaymentFeeBreakdownDto,
  PaymentMethodWithFeeDto,
} from "../dto/payment-charge.dto";

export interface CartItem {
  productVariantId: string;
  quantity: number;
  price: number;
  metadata?: unknown;
}

@Injectable()
export class PaymentChargeService {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * Calculate payment fee for a given method and cart total
   */
  async calculateFee(
    method: string,
    cartTotal: number, // in paise
    currency: string = "INR",
  ): Promise<{ fee: number; breakdown: PaymentFeeBreakdownDto }> {
    // Fetch active charge configuration for the method and currency
    const [chargeConfig] = await db
      .select()
      .from(paymentMethodCharges)
      .where(
        and(
          eq(paymentMethodCharges.method, method as PaymentMethod),
          eq(paymentMethodCharges.currency, currency),
          eq(paymentMethodCharges.active, true),
        ),
      )
      .limit(1);

    if (!chargeConfig) {
      // Fallback to INR if no config found for currency
      if (currency !== "INR") {
        return this.calculateFee(method, cartTotal, "INR");
      }
      this.logger.warn(
        { method, currency },
        "No active charge configuration found, returning zero fee",
      );
      return {
        fee: 0,
        breakdown: {
          method,
          chargeType: "FLAT",
          calculatedFee: 0,
        },
      };
    }

    let fee = 0;
    const breakdown: PaymentFeeBreakdownDto = {
      method,
      chargeType: chargeConfig.chargeType,
      calculatedFee: 0,
    };

    switch (chargeConfig.chargeType) {
      case "FLAT":
        fee = chargeConfig.flatAmount;
        breakdown.flatAmount = chargeConfig.flatAmount;
        break;

      case "PERCENTAGE":
        fee = Math.round((chargeConfig.percentage / 100) * cartTotal);
        breakdown.percentage = chargeConfig.percentage;
        break;

      case "MIXED": {
        // Calculate percentage-based fee
        let baseFee = Math.round((chargeConfig.percentage / 100) * cartTotal);
        breakdown.percentage = chargeConfig.percentage;

        // Apply minimum if specified
        if (chargeConfig.mixMin !== null && chargeConfig.mixMin !== undefined) {
          baseFee = Math.max(baseFee, chargeConfig.mixMin);
          breakdown.mixMin = chargeConfig.mixMin;
        }

        // Apply cap if specified
        if (chargeConfig.mixCap !== null && chargeConfig.mixCap !== undefined) {
          baseFee = Math.min(baseFee, chargeConfig.mixCap);
          breakdown.mixCap = chargeConfig.mixCap;
        }

        // Add flat amount
        fee = baseFee + chargeConfig.flatAmount;
        breakdown.flatAmount = chargeConfig.flatAmount;
        break;
      }
    }

    // Ensure fee is non-negative
    fee = Math.max(0, fee);

    breakdown.calculatedFee = fee;

    return { fee, breakdown };
  }

  /**
   * Get all available payment methods with calculated fees
   */
  async getAvailableMethods(
    cartTotal: number, // in paise
    currency: string = "INR",
    cartItems: CartItem[] = [],
  ): Promise<PaymentMethodWithFeeDto[]> {
    // Fetch all active charge configurations for the currency
    const chargeConfigs = await db
      .select()
      .from(paymentMethodCharges)
      .where(
        and(
          eq(paymentMethodCharges.currency, currency),
          eq(paymentMethodCharges.active, true),
        ),
      );

    // If no configs for currency, fallback to INR
    if (chargeConfigs.length === 0 && currency !== "INR") {
      return this.getAvailableMethods(cartTotal, "INR", cartItems);
    }

    const methods: PaymentMethodWithFeeDto[] = [];

    for (const config of chargeConfigs) {
      const { fee, breakdown } = await this.calculateFee(
        config.method,
        cartTotal,
        currency,
      );

      // Check COD eligibility if method is COD
      let available = true;
      let unavailableReason: string | undefined;

      if (config.method === "COD") {
        const eligibility = this.validateCodEligibility(
          cartTotal,
          cartItems,
          config,
        );
        available = eligibility.eligible;
        unavailableReason = eligibility.reason;
      }

      methods.push({
        method: config.method,
        label: this.getMethodLabel(config.method),
        fee,
        breakdown,
        available,
        unavailableReason,
      });
    }

    return methods;
  }

  /**
   * Validate COD eligibility based on restrictions
   */
  validateCodEligibility(
    cartTotal: number, // in paise
    cartItems: CartItem[],
    chargeConfig: typeof paymentMethodCharges.$inferSelect,
  ): { eligible: boolean; reason?: string } {
    // Check max amount restriction
    if (
      chargeConfig.codMaxAmount !== null &&
      chargeConfig.codMaxAmount !== undefined &&
      cartTotal > chargeConfig.codMaxAmount
    ) {
      return {
        eligible: false,
        reason: `COD not available for orders above ₹${chargeConfig.codMaxAmount / 100}`,
      };
    }

    // Check high-value items restriction
    if (chargeConfig.codDisallowHighValue) {
      // TODO: Implement high-value item detection
      // For now, we'll need to check product metadata or add a field to products
      // This is a placeholder that can be enhanced
    }

    // Check digital products restriction
    if (chargeConfig.codDisallowDigital) {
      // TODO: Implement digital product detection
      // Check if any cart item is a digital product
      // This requires product metadata or a field in products table
    }

    // Check preorder items restriction
    if (chargeConfig.codDisallowPreorder) {
      // TODO: Implement preorder detection
      // Check if any cart item is a preorder product
      // This requires product metadata or a field in products table
    }

    return { eligible: true };
  }

  /**
   * Get human-readable label for payment method
   */
  private getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      COD: "Cash on Delivery",
      RAZORPAY_UPI: "UPI",
      RAZORPAY_CARD: "Card (Razorpay)",
      STRIPE_CARD: "Card (Stripe)",
      WALLET: "Wallet",
      NETBANKING: "Net Banking",
      BNPL: "Buy Now Pay Later",
    };
    return labels[method] || method;
  }
}
