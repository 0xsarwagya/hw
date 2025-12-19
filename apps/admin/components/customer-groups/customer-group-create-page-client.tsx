"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCreateCustomerGroup } from "@/hooks/customer-groups/use-admin-create-customer-group";
import type {
  CreateCustomerGroupInput,
  UpdateCustomerGroupInput,
} from "@/lib/types/customer-groups";
import { CustomerGroupForm } from "./customer-group-form";

export function CustomerGroupCreatePageClient() {
  const createGroup = useAdminCreateCustomerGroup();

  const handleSubmit = async (
    data: CreateCustomerGroupInput | UpdateCustomerGroupInput,
  ) => {
    await createGroup.mutateAsync(data as CreateCustomerGroupInput);
  };

  return (
    <AdminPageLayout
      title="Create Customer Group"
      description="Create a new customer group"
      actions={
        <Button variant="outline" asChild>
          <Link href="/customer-groups">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerGroupForm
            onSubmit={handleSubmit}
            isLoading={createGroup.isPending}
          />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
