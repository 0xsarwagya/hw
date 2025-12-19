"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldErrorProps {
  error?: string | string[];
  className?: string;
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;

  const errorMessage = Array.isArray(error) ? error.join(", ") : error;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm text-destructive mt-1",
        className,
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{errorMessage}</span>
    </div>
  );
}
