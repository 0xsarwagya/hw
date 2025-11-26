"use client";

import { cn } from "@/lib/utils";

type Props = {
  status: "draft" | "active" | "archived";
};

export function ProductStatusBadge({ status }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "draft" &&
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        status === "active" &&
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        status === "archived" &&
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
