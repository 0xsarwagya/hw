"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PaginationControls } from "@/components/common/pagination-controls";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { useAdminDiscountDrift } from "@/hooks/discounts/use-admin-discount-drift";
import type { DriftReportQuery, DriftSeverity } from "@/lib/types/discounts";
import { DiscountDriftFilters } from "./discount-drift-filters";
import { DiscountDriftReportTable } from "./discount-drift-report-table";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

export function DiscountDriftPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<DriftReportQuery>({
    page: parseInt(searchParams.get("page") || String(DEFAULT_PAGE), 10),
    limit: parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10),
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    severity: (searchParams.get("severity") as DriftSeverity) || undefined,
    cartId: searchParams.get("cartId") || undefined,
    orderId: searchParams.get("orderId") || undefined,
  });

  const { data, isLoading, error } = useAdminDiscountDrift(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page && filters.page > DEFAULT_PAGE) {
      params.set("page", filters.page.toString());
    }
    if (filters.limit && filters.limit !== DEFAULT_LIMIT) {
      params.set("limit", filters.limit.toString());
    }
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.cartId) params.set("cartId", filters.cartId);
    if (filters.orderId) params.set("orderId", filters.orderId);

    router.replace(`/discounts/drift?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
    });
  }, []);

  const paginationData = data
    ? {
        startItem: (data.page - 1) * data.limit + 1,
        endItem: Math.min(data.page * data.limit, data.total),
        total: data.total,
        currentPage: data.page,
        totalPages: data.totalPages,
      }
    : null;

  return (
    <AdminPageLayout
      title="Discount Drift Report"
      description="Monitor discount calculation drift and discrepancies"
    >
      <div className="space-y-6">
        <DiscountDriftFilters
          dateFrom={filters.dateFrom ? new Date(filters.dateFrom) : null}
          dateTo={filters.dateTo ? new Date(filters.dateTo) : null}
          severity={filters.severity}
          cartId={filters.cartId}
          orderId={filters.orderId}
          onDateFromChange={(date) =>
            setFilters((prev) => ({
              ...prev,
              dateFrom: date?.toISOString(),
              page: DEFAULT_PAGE,
            }))
          }
          onDateToChange={(date) =>
            setFilters((prev) => ({
              ...prev,
              dateTo: date?.toISOString(),
              page: DEFAULT_PAGE,
            }))
          }
          onSeverityChange={(severity) =>
            setFilters((prev) => ({
              ...prev,
              severity,
              page: DEFAULT_PAGE,
            }))
          }
          onCartIdChange={(cartId) =>
            setFilters((prev) => ({
              ...prev,
              cartId: cartId || undefined,
              page: DEFAULT_PAGE,
            }))
          }
          onOrderIdChange={(orderId) =>
            setFilters((prev) => ({
              ...prev,
              orderId: orderId || undefined,
              page: DEFAULT_PAGE,
            }))
          }
          onClear={handleClearFilters}
        />

        {error && (
          <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive">
            Error loading drift report: {error.message}
          </div>
        )}

        <DiscountDriftReportTable
          entries={data?.data || []}
          isLoading={isLoading}
        />

        {paginationData && paginationData.totalPages > 1 && (
          <PaginationControls
            paginationInfo={paginationData}
            onPreviousPage={() =>
              handlePageChange(paginationData.currentPage - 1)
            }
            onNextPage={() => handlePageChange(paginationData.currentPage + 1)}
            canGoPrevious={data?.page !== 1}
            canGoNext={data?.page < (data?.totalPages || 1)}
            isLoading={isLoading}
            itemLabel="events"
          />
        )}
      </div>
    </AdminPageLayout>
  );
}
