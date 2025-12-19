"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCreateDiscount } from "@/hooks/discounts/use-admin-create-discount";
import type { CreateDiscountInput } from "@/lib/types/discounts";
import { DiscountFormWizard } from "./discount-form-wizard";

export function DiscountCreatePageClient() {
  const _router = useRouter();
  const createDiscount = useAdminCreateDiscount();

  const handleSubmit = async (data: CreateDiscountInput) => {
    await createDiscount.mutateAsync(data);
  };

  return (
    <AdminPageLayout
      title="Create Discount"
      description="Create a new discount code"
      actions={
        <Button variant="outline" asChild>
          <Link href="/discounts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Discount Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DiscountFormWizard
            onSubmit={handleSubmit}
            isLoading={createDiscount.isPending}
          />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
