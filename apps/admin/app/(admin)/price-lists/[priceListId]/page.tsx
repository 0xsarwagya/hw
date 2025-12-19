"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useAdminPriceList } from "@/hooks/pricing/use-admin-price-list";
import { useAdminUpdatePriceList } from "@/hooks/pricing/use-admin-update-price-list";
import { useAdminDeletePriceList } from "@/hooks/pricing/use-admin-delete-price-list";
import { useForm } from "react-hook-form";
import type { UpdatePriceListInput } from "@/lib/types/price-lists";
import { FieldError } from "@/components/ui/field-error";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingButton } from "@/components/ui/loading-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { FetchError } from "@/lib/api";

export default function PriceListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const priceListId = params.priceListId as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [apiError, setApiError] = useState<FetchError | null>(null);

  const { data: priceList, isLoading } = useAdminPriceList(priceListId);
  const updatePriceList = useAdminUpdatePriceList(priceListId);
  const deletePriceList = useAdminDeletePriceList();

  const { register, handleSubmit, reset, formState: { errors }, setError } = useForm<UpdatePriceListInput>();

  useEffect(() => {
    if (priceList) {
      reset({
        name: priceList.name,
        description: priceList.description,
        isActive: priceList.isActive,
      });
    }
  }, [priceList, reset]);

  const onSubmit = async (data: UpdatePriceListInput) => {
    setApiError(null);
    try {
      await updatePriceList.mutateAsync(data);
    } catch (error) {
      if (error instanceof Error && "errors" in error) {
        const fetchError = error as FetchError;
        setApiError(fetchError);
        
        if (fetchError.errors) {
          Object.entries(fetchError.errors).forEach(([field, messages]) => {
            setError(field as keyof UpdatePriceListInput, {
              type: "server",
              message: Array.isArray(messages) ? messages.join(", ") : messages,
            });
          });
        }
      }
    }
  };

  const handleDelete = async () => {
    await deletePriceList.mutateAsync(priceListId);
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Loading..."
        description="Loading price list details"
        breadcrumbs={[
          { label: "Price Lists", href: "/price-lists" },
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

  if (!priceList) {
    return (
      <AdminPageLayout
        title="Not Found"
        description="Price list not found"
        breadcrumbs={[
          { label: "Price Lists", href: "/price-lists" },
          { label: "Not Found" },
        ]}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Price list not found</p>
          <Button asChild>
            <Link href="/price-lists">Back to Price Lists</Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={priceList.name}
      description="Edit price list"
      breadcrumbs={[
        { label: "Price Lists", href: "/price-lists" },
        { label: priceList.name },
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
        title="Delete Price List"
        description="Are you sure you want to delete this price list? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deletePriceList.isPending}
      />

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
              aria-invalid={errors.name ? "true" : "false"}
            />
            <FieldError error={errors.name?.message} />
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
        </div>

        <div className="flex gap-4">
          <LoadingButton
            type="submit"
            isLoading={updatePriceList.isPending}
            loadingText="Saving..."
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
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

