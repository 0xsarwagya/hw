"use client";

import { cn } from "@/lib/utils";

interface DateTimeProps {
  date: Date | string;
  className?: string;
  format?: "short" | "long" | "date" | "time";
}

const formatDate = (
  date: Date | string,
  format: DateTimeProps["format"] = "short",
) => {
  const d = typeof date === "string" ? new Date(date) : date;

  switch (format) {
    case "long":
      return d.toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
      });
    case "date":
      return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    case "time":
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return d.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  }
};

export function DateTime({ date, className, format = "short" }: DateTimeProps) {
  return (
    <span className={cn("text-sm", className)}>{formatDate(date, format)}</span>
  );
}
