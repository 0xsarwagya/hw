"use client";

import { useCallback } from "react";

/**
 * Pagination data structure returned from API
 */
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Hook for managing pagination state and actions
 *
 * @param data - Pagination data from API response
 * @param onPageChange - Callback function called when page changes
 * @returns Pagination state and helper functions
 *
 * @example
 * ```tsx
 * const { data } = useAdminProducts(filters);
 * const pagination = usePagination(data, (page) => {
 *   setFilters(prev => ({ ...prev, page }));
 * });
 *
 * return (
 *   <div>
 *     {pagination.paginationInfo}
 *     <Button onClick={pagination.handlePreviousPage}>Previous</Button>
 *     <Button onClick={pagination.handleNextPage}>Next</Button>
 *   </div>
 * );
 * ```
 */
export function usePagination(
  data: PaginationData | undefined,
  onPageChange: (page: number) => void,
) {
  const handlePreviousPage = useCallback(() => {
    if (data?.hasPreviousPage) {
      onPageChange(data.page - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [data, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (data?.hasNextPage) {
      onPageChange(data.page + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [data, onPageChange]);

  const paginationInfo = data
    ? {
        startItem: (data.page - 1) * data.limit + 1,
        endItem: Math.min(data.page * data.limit, data.total),
        total: data.total,
        currentPage: data.page,
        totalPages: data.totalPages,
      }
    : null;

  return {
    handlePreviousPage,
    handleNextPage,
    paginationInfo,
    canGoPrevious: data?.hasPreviousPage ?? false,
    canGoNext: data?.hasNextPage ?? false,
  };
}
