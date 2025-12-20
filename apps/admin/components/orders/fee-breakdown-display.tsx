"use client";

import type { Order } from "@/lib/types/orders";
import { Money } from "./money";

interface PaymentFeeBreakdown {
  method: string;
  chargeType: "FLAT" | "PERCENTAGE" | "MIXED";
  calculatedFee: number;
  flatAmount?: number;
  percentage?: number;
  mixMin?: number;
  mixCap?: number;
}

interface FeeBreakdownDisplayProps {
  paymentFee: number; // in paise
  paymentFeeBreakdown?: PaymentFeeBreakdown | null;
  paymentMethod?: string | null;
  className?: string;
  compact?: boolean;
}

/**
 * Reusable component to display payment fee breakdown
 * Shows fee details in a consistent format across all locations
 */
export function FeeBreakdownDisplay({
  paymentFee,
  paymentFeeBreakdown,
  paymentMethod,
  className = "",
  compact = false,
}: FeeBreakdownDisplayProps) {
  // Don't render if no fee
  if (!paymentFee || paymentFee === 0) {
    return null;
  }

  const feeInRupees = paymentFee / 100;
  const methodLabel = paymentMethod || "Payment Method";

  if (compact) {
    return (
      <div className={`flex justify-between text-sm ${className}`}>
        <span className="text-muted-foreground">
          Payment Fee ({methodLabel})
        </span>
        <Money amount={feeInRupees} />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Payment Fee ({methodLabel})
        </span>
        <Money amount={feeInRupees} />
      </div>
      {paymentFeeBreakdown && (
        <div className="pl-4 space-y-1 text-xs text-muted-foreground border-l-2">
          {paymentFeeBreakdown.chargeType === "FLAT" &&
            paymentFeeBreakdown.flatAmount !== undefined && (
              <div className="flex justify-between">
                <span>Base Fee:</span>
                <Money amount={paymentFeeBreakdown.flatAmount / 100} />
              </div>
            )}
          {paymentFeeBreakdown.chargeType === "PERCENTAGE" &&
            paymentFeeBreakdown.percentage !== undefined && (
              <div className="flex justify-between">
                <span>Percentage ({paymentFeeBreakdown.percentage}%):</span>
                <Money amount={feeInRupees} />
              </div>
            )}
          {paymentFeeBreakdown.chargeType === "MIXED" && (
            <>
              {paymentFeeBreakdown.flatAmount !== undefined && (
                <div className="flex justify-between">
                  <span>Base Fee:</span>
                  <Money amount={paymentFeeBreakdown.flatAmount / 100} />
                </div>
              )}
              {paymentFeeBreakdown.percentage !== undefined && (
                <div className="flex justify-between">
                  <span>Percentage ({paymentFeeBreakdown.percentage}%):</span>
                  <Money
                    amount={
                      (paymentFeeBreakdown.calculatedFee -
                        (paymentFeeBreakdown.flatAmount || 0)) /
                      100
                    }
                  />
                </div>
              )}
              {paymentFeeBreakdown.mixMin !== undefined && (
                <div className="text-xs text-muted-foreground/70">
                  Min: <Money amount={paymentFeeBreakdown.mixMin / 100} />
                </div>
              )}
              {paymentFeeBreakdown.mixCap !== undefined && (
                <div className="text-xs text-muted-foreground/70">
                  Max: <Money amount={paymentFeeBreakdown.mixCap / 100} />
                </div>
              )}
            </>
          )}
          <div className="flex justify-between font-medium pt-1 border-t">
            <span>Total Fee:</span>
            <Money amount={feeInRupees} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Fee breakdown display for Order type
 */
export function OrderFeeBreakdown({ order }: { order: Order }) {
  if (!order.paymentFee || order.paymentFee === 0) {
    return null;
  }

  return (
    <FeeBreakdownDisplay
      paymentFee={order.paymentFee}
      paymentFeeBreakdown={
        order.paymentFeeBreakdown as PaymentFeeBreakdown | null | undefined
      }
      paymentMethod={order.paymentMethod || undefined}
    />
  );
}
