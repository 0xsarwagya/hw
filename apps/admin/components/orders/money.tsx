"use client";

import { cn } from "@/lib/utils";

interface MoneyProps {
  amount: number;
  className?: string;
  showCurrency?: boolean;
}

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function Money({ amount, className, showCurrency = true }: MoneyProps) {
  const formatted = showCurrency
    ? formatter.format(amount)
    : amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return <span className={cn("font-medium", className)}>{formatted}</span>;
}

