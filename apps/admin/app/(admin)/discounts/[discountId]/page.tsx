"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorDisplay } from "@/components/ui/error-display";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminDeleteDiscount } from "@/hooks/discounts/use-admin-delete-discount";
import { useAdminDiscount } from "@/hooks/discounts/use-admin-discount";
import { useAdminUpdateDiscount } from "@/hooks/discounts/use-admin-update-discount";
import type { FetchError } from "@/lib/api";
import type { UpdateDiscountInput } from "@/lib/types/discounts";

export default function DiscountDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const discountId = params.discountId as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [apiError, setApiError] = useState<FetchError | null>(null);

  const { data: discount, isLoading } = useAdminDiscount(discountId);
  const updateDiscount = useAdminUpdateDiscount(discountId);
  const deleteDiscount = useAdminDeleteDiscount();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
    setError,
  } = useForm<UpdateDiscountInput>();

  useEffect(() => {
    if (discount) {
      reset({
        code: discount.code,
        type: discount.type,
        description: discount.description,
        value: discount.value,
        valueType: discount.valueType,
        minOrderAmount: discount.minOrderAmount,
        maxDiscountAmount: discount.maxDiscountAmount,
        maxUses: discount.maxUses,
        isActive: discount.isActive,
      });
    }
  }, [discount, reset]);

  const onSubmit = async (data: UpdateDiscountInput) => {
    setApiError(null);
    try {
      await updateDiscount.mutateAsync(data);
    } catch (error) {
      if (error instanceof Error && "errors" in error) {
        const fetchError = error as FetchError;
        setApiError(fetchError);

        if (fetchError.errors) {
          Object.entries(fetchError.errors).forEach(([field, messages]) => {
            setError(field as keyof UpdateDiscountInput, {
              type: "server",
              message: Array.isArray(messages) ? messages.join(", ") : messages,
            });
          });
        }
      }
    }
  };

  const handleDelete = async () => {
    await deleteDiscount.mutateAsync(discountId);
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Loading..."
        description="Loading discount details"
        breadcrumbs={[
          { label: "Discounts", href: "/discounts" },
          { label: "Loading..." },
        ]}
      >
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
        </div>
      </AdminPageLayout>
    );
  }

  if (!discount) {
    return (
      <AdminPageLayout
        title="Not Found"
        description="Discount not found"
        breadcrumbs={[
          { label: "Discounts", href: "/discounts" },
          { label: "Not Found" },
        ]}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Discount not found</p>
          <Button asChild>
            <Link href="/discounts">Back to Discounts</Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={discount.code}
      description="Edit discount code"
      breadcrumbs={[
        { label: "Discounts", href: "/discounts" },
        { label: discount.code },
      ]}
      actions={
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          Delete
        </Button>
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
        onConfirm={handleDelete}
        isLoading={deleteDiscount.isPending}
      />

      {apiError && (
        <ErrorDisplay error={apiError} onRetry={() => setApiError(null)} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Discount Code *</Label>
            <Input
              id="code"
              {...register("code", { required: "Discount code is required" })}
              aria-invalid={errors.code ? "true" : "false"}
            />
            <FieldError error={errors.code?.message} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={watch("type") || discount.type}
              onValueChange={(value) =>
                setValue("type", value as "STANDARD" | "BUY_GET", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger aria-invalid={errors.type ? "true" : "false"}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="BUY_GET">Buy & Get</SelectItem>
              </SelectContent>
            </Select>
            <FieldError error={errors.type?.message} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              aria-invalid={errors.description ? "true" : "false"}
            />
            <FieldError error={errors.description?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                {...register("value", {
                  required: "Value is required",
                  valueAsNumber: true,
                })}
                aria-invalid={errors.value ? "true" : "false"}
              />
              <FieldError error={errors.value?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valueType">Value Type *</Label>
              <Select
                value={watch("valueType") || discount.valueType}
                onValueChange={(value) =>
                  setValue("valueType", value as "percentage" | "fixed", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  aria-invalid={errors.valueType ? "true" : "false"}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
              <FieldError error={errors.valueType?.message} />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <LoadingButton
            type="submit"
            isLoading={updateDiscount.isPending}
            loadingText="Saving..."
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </LoadingButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/discounts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
