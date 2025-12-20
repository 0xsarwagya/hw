"use client";

import { useSearchParams } from "next/navigation";
import { use } from "react";
import { QueryState } from "@/components/common/query-state";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { InventoryLogsSkeleton } from "@/components/skeletons/inventory-logs-skeleton";
import { useInventoryItem } from "@/hooks/inventory/use-inventory-item";
import { useInventoryLogs } from "@/hooks/inventory/use-inventory-logs";
import { usePagination } from "@/hooks/use-pagination";
import type { InventoryLogsQueryParams } from "@/lib/types/inventory";
import { PaginationControls } from "../common/pagination-controls";
import { InventoryLogsTable } from "./inventory-logs-table";

interface InventoryLogsClientProps {
  params: Promise<{ variantId: string }>;
}

/**
 * Client component for inventory logs page
 */
export function InventoryLogsClient({ params }: InventoryLogsClientProps) {
  const { variantId } = use(params);
  const searchParams = useSearchParams();

  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const queryParams: InventoryLogsQueryParams = {
    page: pageParam ? parseInt(pageParam, 10) : 1,
    limit: limitParam ? parseInt(limitParam, 10) : 50,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    actor: searchParams.get("actor") || undefined,
    reason:
      (searchParams.get("reason") as InventoryLogsQueryParams["reason"]) ||
      undefined,
    type:
      (searchParams.get("type") as InventoryLogsQueryParams["type"]) ||
      undefined,
  };

  const { data: item } = useInventoryItem(variantId);
  const {
    data: logsData,
    isLoading,
    error,
  } = useInventoryLogs(variantId, queryParams);

  const handlePageChange = () => {
    // Page change handled via URL params
  };

  // Transform logs pagination to match usePagination expected format
  const paginationData = logsData
    ? {
        page: logsData.pagination.page,
        limit: logsData.pagination.limit,
        total: logsData.pagination.total,
        totalPages: logsData.pagination.totalPages,
        hasNextPage: logsData.pagination.page < logsData.pagination.totalPages,
        hasPreviousPage: logsData.pagination.page > 1,
      }
    : undefined;

  const pagination = usePagination(paginationData, handlePageChange);

  return (
    <AdminPageLayout
      title="Inventory Logs"
      description={
        item?.sku
          ? `Audit logs for ${item.sku}`
          : "View inventory adjustment logs"
      }
      pagination={
        <PaginationControls
          paginationInfo={pagination.paginationInfo}
          onPreviousPage={pagination.handlePreviousPage}
          onNextPage={pagination.handleNextPage}
          canGoPrevious={pagination.canGoPrevious}
          canGoNext={pagination.canGoNext}
          isLoading={isLoading}
          itemLabel="logs"
        />
      }
    >
      <QueryState
        isLoading={isLoading}
        error={error}
        data={logsData}
        loadingComponent={<InventoryLogsSkeleton />}
        onRetry={() => window.location.reload()}
      >
        {logsData && <InventoryLogsTable logs={logsData.data} />}
      </QueryState>
    </AdminPageLayout>
  );
}
