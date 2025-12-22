"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryState } from "@/components/common/query-state";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminShippingMethod } from "@/hooks/shipping/use-admin-shipping-method";
import { useAdminUpdateShippingMethod } from "@/hooks/shipping/use-admin-update-shipping-method";
import type { UpdateShippingMethodInput } from "@/lib/types/shipping-methods";
import { ShippingMethodForm } from "./shipping-method-form";

export function ShippingMethodDetailPageClient() {
  const params = useParams();
  const id = params.id as string;

  const { data: method, isLoading, error } = useAdminShippingMethod(id);
  const updateMethod = useAdminUpdateShippingMethod(id);

  const handleSubmit = async (data: UpdateShippingMethodInput) => {
    await updateMethod.mutateAsync(data);
  };

  return (
    <AdminPageLayout
      title="Edit Shipping Method"
      description="Update shipping method details"
      actions={
        <Button variant="outline" asChild>
          <Link href="/settings/shipping-methods">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <QueryState
        isLoading={isLoading}
        error={error}
        data={method}
        loadingComponent={<TableSkeleton columns={1} rows={10} />}
        emptyComponent={
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Shipping method not found</p>
          </div>
        }
        onRetry={() => window.location.reload()}
      >
        {method && (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Method Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ShippingMethodForm
                method={method}
                onSubmit={handleSubmit}
                isLoading={updateMethod.isPending}
              />
            </CardContent>
          </Card>
        )}
      </QueryState>
    </AdminPageLayout>
  );
}
