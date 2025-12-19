"use client";

import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminDeleteDiscount } from "@/hooks/discounts/use-admin-delete-discount";
import { useAdminDiscount } from "@/hooks/discounts/use-admin-discount";
import { useAdminUpdateDiscount } from "@/hooks/discounts/use-admin-update-discount";
import type { UpdateDiscountInput } from "@/lib/types/discounts";
import { DiscountFormWizard } from "./discount-form-wizard";

export function DiscountDetailPageClient() {
  const params = useParams();
  const _router = useRouter();
  const discountId = params.discountId as string;

  const { data: discount, isLoading, error } = useAdminDiscount(discountId);
  const updateDiscount = useAdminUpdateDiscount(discountId);
  const deleteDiscount = useAdminDeleteDiscount(discountId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSubmit = async (data: UpdateDiscountInput) => {
    await updateDiscount.mutateAsync(data);
  };

  const handleDelete = async () => {
    await deleteDiscount.mutateAsync();
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <AdminPageLayout title="Discount" description="Loading...">
        <div className="space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminPageLayout>
    );
  }

  if (error || !discount) {
    return (
      <AdminPageLayout title="Discount" description="Error">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            {error?.message || "Discount not found"}
          </p>
          <Button asChild variant="outline">
            <Link href="/discounts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Discounts
            </Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={
        <div className="flex items-center gap-2">
          {discount.name}
          <Badge variant={discount.isActive ? "default" : "secondary"}>
            {discount.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      }
      description={discount.description || undefined}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" asChild>
            <Link href="/discounts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="edit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Discount</CardTitle>
              <CardDescription>
                Update discount details and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DiscountFormWizard
                initialData={discount}
                onSubmit={handleSubmit}
                isLoading={updateDiscount.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discount Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Code
                  </span>
                  <p className="text-lg font-mono">{discount.code}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Type
                  </span>
                  <p className="text-lg">{discount.type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Application Type
                  </span>
                  <p className="text-lg">{discount.applicationType}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Value
                  </span>
                  <p className="text-lg">
                    {discount.valueType === "PERCENTAGE"
                      ? `${discount.value}%`
                      : `₹${discount.value.toLocaleString()}`}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Priority
                  </span>
                  <p className="text-lg">{discount.priority}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Usage Count
                  </span>
                  <p className="text-lg">
                    {discount.usageCount} / {discount.usageLimit || "Unlimited"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </span>
                  <p className="text-sm">
                    {format(new Date(discount.startDate), "PPP")}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    End Date
                  </span>
                  <p className="text-sm">
                    {discount.endDate
                      ? format(new Date(discount.endDate), "PPP")
                      : "No end date"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Discount"
        description="Are you sure you want to delete this discount? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteDiscount.isPending}
      />
    </AdminPageLayout>
  );
}
