"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCreateShippingMethod } from "@/hooks/shipping/use-admin-create-shipping-method";
import type {
  CreateShippingMethodInput,
  UpdateShippingMethodInput,
} from "@/lib/types/shipping-methods";
import { ShippingMethodForm } from "./shipping-method-form";

export function ShippingMethodCreatePageClient() {
  const createMethod = useAdminCreateShippingMethod();

  const handleSubmit = async (
    data: CreateShippingMethodInput | UpdateShippingMethodInput,
  ) => {
    await createMethod.mutateAsync(data as CreateShippingMethodInput);
  };

  return (
    <AdminPageLayout
      title="Create Shipping Method"
      description="Create a new shipping method"
      actions={
        <Button variant="outline" asChild>
          <Link href="/settings/shipping-methods">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Shipping Method Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShippingMethodForm
            onSubmit={handleSubmit}
            isLoading={createMethod.isPending}
          />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
