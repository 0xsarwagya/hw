"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { BundleDetailOverview } from "@/components/bundles/bundle-detail-overview";
import { BundleSetsManager } from "@/components/bundles/bundle-sets-manager";
import { BundleSummaryCard } from "@/components/bundles/bundle-summary-card";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorDisplay } from "@/components/ui/error-display";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminBundle } from "@/hooks/bundles/use-admin-bundle";
import { useAdminDeleteBundle } from "@/hooks/bundles/use-admin-delete-bundle";
import { useAdminUpdateBundle } from "@/hooks/bundles/use-admin-update-bundle";
import type { FetchError } from "@/lib/api";
import type { UpdateBundleInput } from "@/lib/types/bundles";

export default function BundleDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const bundleId = params.bundleId as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [apiError, setApiError] = useState<FetchError | null>(null);

  const { data: bundle, isLoading } = useAdminBundle(bundleId);
  const updateBundle = useAdminUpdateBundle(bundleId);
  const deleteBundle = useAdminDeleteBundle();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<UpdateBundleInput>();

  useEffect(() => {
    if (bundle) {
      reset({
        title: bundle.title,
        description: bundle.description,
        isActive: bundle.isActive,
      });
    }
  }, [bundle, reset]);

  const onSubmit = async (data: UpdateBundleInput) => {
    setApiError(null);
    try {
      await updateBundle.mutateAsync(data);
    } catch (error) {
      if (error instanceof Error && "errors" in error) {
        const fetchError = error as FetchError;
        setApiError(fetchError);

        if (fetchError.errors) {
          Object.entries(fetchError.errors).forEach(([field, messages]) => {
            setError(field as keyof UpdateBundleInput, {
              type: "server",
              message: Array.isArray(messages) ? messages.join(", ") : messages,
            });
          });
        }
      }
    }
  };

  const handleDelete = async () => {
    await deleteBundle.mutateAsync(bundleId);
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <AdminPageLayout
        title="Loading..."
        description="Loading bundle details"
        breadcrumbs={[
          { label: "Bundles", href: "/bundles" },
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

  if (!bundle) {
    return (
      <AdminPageLayout
        title="Not Found"
        description="Bundle not found"
        breadcrumbs={[
          { label: "Bundles", href: "/bundles" },
          { label: "Not Found" },
        ]}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Bundle not found</p>
          <Button asChild>
            <Link href="/bundles">Back to Bundles</Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={bundle.title}
      description="Edit bundle"
      breadcrumbs={[
        { label: "Bundles", href: "/bundles" },
        { label: bundle.title },
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
        title="Delete Bundle"
        description="Are you sure you want to delete this bundle? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteBundle.isPending}
      />

      {apiError && (
        <ErrorDisplay error={apiError} onRetry={() => setApiError(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="sets">Choice Sets</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bundle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          {...register("title", {
                            required: "Title is required",
                          })}
                          aria-invalid={errors.title ? "true" : "false"}
                        />
                        <FieldError error={errors.title?.message} />
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
                        isLoading={updateBundle.isPending}
                        loadingText="Saving..."
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </LoadingButton>
                      <Button type="button" variant="outline" asChild>
                        <Link href="/bundles">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Cancel
                        </Link>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sets" className="space-y-4">
              <BundleSetsManager bundleId={bundleId} />
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <BundleDetailOverview bundle={bundle} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <BundleSummaryCard bundle={bundle} />
        </div>
      </div>
    </AdminPageLayout>
  );
}
