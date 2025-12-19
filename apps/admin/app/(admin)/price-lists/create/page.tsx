"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAdminCreatePriceList } from "@/hooks/pricing/use-admin-create-price-list";
import { useForm } from "react-hook-form";
import type { CreatePriceListInput } from "@/lib/types/price-lists";
import { FieldError } from "@/components/ui/field-error";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingButton } from "@/components/ui/loading-button";
import type { FetchError } from "@/lib/api";

export default function CreatePriceListPage() {
  const router = useRouter();
  const createPriceList = useAdminCreatePriceList();
  const [apiError, setApiError] = useState<FetchError | null>(null);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<CreatePriceListInput>({
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: CreatePriceListInput) => {
    setApiError(null);
    try {
      await createPriceList.mutateAsync(data);
    } catch (error) {
      if (error instanceof Error && "errors" in error) {
        const fetchError = error as FetchError;
        setApiError(fetchError);
        
        if (fetchError.errors) {
          Object.entries(fetchError.errors).forEach(([field, messages]) => {
            setError(field as keyof CreatePriceListInput, {
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
      title="Create Price List"
      description="Create a new price list"
      breadcrumbs={[
        { label: "Price Lists", href: "/price-lists" },
        { label: "Create" },
      ]}
    >
      {apiError && (
        <ErrorDisplay error={apiError} onRetry={() => setApiError(null)} />
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              placeholder="Wholesale Prices"
              aria-invalid={errors.name ? "true" : "false"}
            />
            <FieldError error={errors.name?.message} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Optional description"
              aria-invalid={errors.description ? "true" : "false"}
            />
            <FieldError error={errors.description?.message} />
          </div>
        </div>

        <div className="flex gap-4">
          <LoadingButton
            type="submit"
            isLoading={createPriceList.isPending}
            loadingText="Creating..."
          >
            Create Price List
          </LoadingButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/price-lists">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  );
}

