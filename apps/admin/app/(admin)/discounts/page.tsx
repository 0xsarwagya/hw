"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminDiscounts } from "@/hooks/discounts/use-admin-discounts";
import { useAdminDeleteDiscount } from "@/hooks/discounts/use-admin-delete-discount";
import type { DiscountQueryParams } from "@/lib/types/discounts";
import { DateTime } from "@/components/orders/date-time";
import { Money } from "@/components/orders/money";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorDisplay } from "@/components/ui/error-display";
import type { FetchError } from "@/lib/api";

export default function DiscountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deleteDiscount = useAdminDeleteDiscount();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

  const [filters, setFilters] = useState<DiscountQueryParams>({
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
  });

  const { data, isLoading, error, refetch } = useAdminDiscounts(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());
    if (filters.limit && filters.limit !== 10) params.set("limit", filters.limit.toString());

    router.replace(`/discounts?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  const handleDeleteClick = (discountId: string) => {
    setDiscountToDelete(discountId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (discountToDelete) {
      await deleteDiscount.mutateAsync(discountToDelete);
      setDeleteDialogOpen(false);
      setDiscountToDelete(null);
    }
  };

  return (
    <AdminPageLayout
      title="Discounts"
      description="Manage discount codes"
      actions={
        <Button asChild>
          <Link href="/discounts/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Discount
          </Link>
        </Button>
      }
      pagination={
        data && (
          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {data.total === 0 ? (
                "Showing 0 discounts"
              ) : (
                <>
                  Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} discounts
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                disabled={data.page <= 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={data.page >= data.totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )
      }
    >
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Discount"
        description="Are you sure you want to delete this discount? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteDiscount.isPending}
      />

      {error && (
        <ErrorDisplay error={error as FetchError} onRetry={() => refetch()} className="mb-4" />
      )}

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="h-12 animate-pulse bg-muted" />
                  <TableCell className="h-12 animate-pulse bg-muted" />
                  <TableCell className="h-12 animate-pulse bg-muted" />
                  <TableCell className="h-12 animate-pulse bg-muted" />
                  <TableCell className="h-12 animate-pulse bg-muted" />
                  <TableCell className="h-12 animate-pulse bg-muted" />
                  <TableCell className="h-12 animate-pulse bg-muted" />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : data && data.data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No discounts found</p>
          <p className="text-sm mb-4">Create your first discount code</p>
          <Button asChild>
            <Link href="/discounts/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Discount
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">{discount.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{discount.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {discount.valueType === "percentage" ? (
                      `${discount.value}%`
                    ) : (
                      <Money amount={discount.value} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={discount.isActive ? "default" : "secondary"}>
                      {discount.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {discount.maxUses ? `${discount.usedCount}/${discount.maxUses}` : discount.usedCount}
                  </TableCell>
                  <TableCell>
                    <DateTime date={discount.createdAt} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/discounts/${discount.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(discount.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageLayout>
  );
}

