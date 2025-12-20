"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationInfo {
  startItem: number;
  endItem: number;
  total: number;
  currentPage: number;
  totalPages: number;
}

interface PaginationControlsProps {
  paginationInfo: PaginationInfo | null;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLoading?: boolean;
  itemLabel?: string; // e.g., "products", "orders"
}

/**
 * Reusable pagination controls component
 * Displays pagination info and navigation buttons
 */
export function PaginationControls({
  paginationInfo,
  onPreviousPage,
  onNextPage,
  canGoPrevious,
  canGoNext,
  isLoading = false,
  itemLabel = "items",
}: PaginationControlsProps) {
  if (!paginationInfo) {
    return null;
  }

  const { startItem, endItem, total, currentPage, totalPages } = paginationInfo;

  if (totalPages <= 1) {
    return null;
  }

  const paginationText =
    total === 0
      ? `Showing 0 ${itemLabel}`
      : `Showing ${(startItem ?? 0).toLocaleString()} to ${(endItem ?? 0).toLocaleString()} of ${(total ?? 0).toLocaleString()} ${itemLabel}`;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">{paginationText}</div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!canGoPrevious || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canGoNext || isLoading}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
