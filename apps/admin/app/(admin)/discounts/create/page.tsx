"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
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
import { useAdminCreateDiscount } from "@/hooks/discounts/use-admin-create-discount";
import type { FetchError } from "@/lib/api";
import type { CreateDiscountInput } from "@/lib/types/discounts";

export default function CreateDiscountPage() {
  const _router = useRouter();
  const createDiscount = useAdminCreateDiscount();
  const [apiError, setApiError] = useState<FetchError | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<CreateDiscountInput>({
    defaultValues: {
      type: "STANDARD",
      valueType: "percentage",
      isActive: true,
    },
  });

  const _valueType = watch("valueType");

  const onSubmit = async (data: CreateDiscountInput) => {
    setApiError(null);
    try {
      await createDiscount.mutateAsync(data);
    } catch (error) {
      if (error instanceof Error && "errors" in error) {
        const fetchError = error as FetchError;
        setApiError(fetchError);

        // Set field-level errors
        if (fetchError.errors) {
          Object.entries(fetchError.errors).forEach(([field, messages]) => {
            setError(field as keyof CreateDiscountInput, {
              type: "server",
              message: Array.isArray(messages) ? messages.join(", ") : messages,
            });
          });
        }
      }
    }
  };

  return (
    <AdminPageLayout
      title="Create Discount"
      description="Create a new discount code"
      breadcrumbs={[
        { label: "Discounts", href: "/discounts" },
        { label: "Create" },
      ]}
    >
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
              placeholder="SUMMER2024"
              aria-invalid={errors.code ? "true" : "false"}
            />
            <FieldError error={errors.code?.message} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              onValueChange={(value) =>
                setValue("type", value as "STANDARD" | "BUY_GET", {
                  shouldValidate: true,
                })
              }
              defaultValue="STANDARD"
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
              placeholder="Optional description"
            />
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
                placeholder="10"
                aria-invalid={errors.value ? "true" : "false"}
              />
              <FieldError error={errors.value?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valueType">Value Type *</Label>
              <Select
                onValueChange={(value) =>
                  setValue("valueType", value as "percentage" | "fixed", {
                    shouldValidate: true,
                  })
                }
                defaultValue="percentage"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="minOrderAmount">Min Order Amount</Label>
              <Input
                id="minOrderAmount"
                type="number"
                step="0.01"
                {...register("minOrderAmount", { valueAsNumber: true })}
                placeholder="0"
                aria-invalid={errors.minOrderAmount ? "true" : "false"}
              />
              <FieldError error={errors.minOrderAmount?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxDiscountAmount">Max Discount Amount</Label>
              <Input
                id="maxDiscountAmount"
                type="number"
                step="0.01"
                {...register("maxDiscountAmount", { valueAsNumber: true })}
                placeholder="Unlimited"
                aria-invalid={errors.maxDiscountAmount ? "true" : "false"}
              />
              <FieldError error={errors.maxDiscountAmount?.message} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxUses">Max Uses</Label>
            <Input
              id="maxUses"
              type="number"
              {...register("maxUses", { valueAsNumber: true })}
              placeholder="Unlimited"
              aria-invalid={errors.maxUses ? "true" : "false"}
            />
            <FieldError error={errors.maxUses?.message} />
          </div>
        </div>

        <div className="flex gap-4">
          <LoadingButton
            type="submit"
            isLoading={createDiscount.isPending}
            loadingText="Creating..."
          >
            Create Discount
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
