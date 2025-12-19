"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FetchError } from "@/lib/api";

/**
 * Props for QueryState component
 */
export interface QueryStateProps<T> {
  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: FetchError | null;

  /**
   * Data to check for empty state
   */
  data: T | undefined;

  /**
   * Loading component/skeleton to show
   */
  loadingComponent?: ReactNode;

  /**
   * Error component to show (optional, uses default if not provided)
   */
  errorComponent?: ReactNode;

  /**
   * Empty state component to show when data is empty
   */
  emptyComponent?: ReactNode;

  /**
   * Function to check if data is empty (default: checks array length or falsy)
   */
  isEmpty?: (data: T) => boolean;

  /**
   * Content to render when data is available
   */
  children: ReactNode;

  /**
   * Callback for retry button in error state
   */
  onRetry?: () => void;
}

/**
 * Reusable component for handling query states (loading, error, empty, success)
 *
 * Simplifies conditional rendering by handling all query states in one component.
 * Uses early return pattern internally for better readability.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAdminProducts(filters);
 *
 * return (
 *   <QueryState
 *     isLoading={isLoading}
 *     error={error}
 *     data={data}
 *     loadingComponent={<ProductsTableSkeleton />}
 *     emptyComponent={<EmptyProductsState />}
 *   >
 *     <ProductsTable products={data.data} />
 *   </QueryState>
 * );
 * ```
 */
export function QueryState<T>({
  isLoading,
  error,
  data,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = (d) => {
    if (Array.isArray(d)) return d.length === 0;
    if (d && typeof d === "object" && "data" in d) {
      return Array.isArray(d.data) ? d.data.length === 0 : false;
    }
    return !d;
  },
  children,
  onRetry,
}: QueryStateProps<T>) {
  // Loading state
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // Error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-2">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">
            {error.message || "Unknown error occurred"}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-4">
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  if (data && isEmpty(data)) {
    return <>{emptyComponent}</>;
  }

  // Success state - render children
  return <>{children}</>;
}
