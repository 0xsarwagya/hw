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
import { Textarea } from "@/components/ui/textarea";
import { useAdminCreateBundle } from "@/hooks/bundles/use-admin-create-bundle";
import type { FetchError } from "@/lib/api";
import type { CreateBundleInput } from "@/lib/types/bundles";

export default function CreateBundlePage() {
  const _router = useRouter();
  const createBundle = useAdminCreateBundle();
  const [apiError, setApiError] = useState<FetchError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateBundleInput>({
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateBundleInput) => {
    setApiError(null);
    try {
      await createBundle.mutateAsync(data);
    } catch (error) {
      if (error instanceof Error && "errors" in error) {
        const fetchError = error as FetchError;
        setApiError(fetchError);

        if (fetchError.errors) {
          Object.entries(fetchError.errors).forEach(([field, messages]) => {
            setError(field as keyof CreateBundleInput, {
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
      title="Create Bundle"
      description="Create a new product bundle"
      breadcrumbs={[
        { label: "Bundles", href: "/bundles" },
        { label: "Create" },
      ]}
    >
      {apiError && (
        <ErrorDisplay error={apiError} onRetry={() => setApiError(null)} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title", { required: "Title is required" })}
              placeholder="Summer Bundle"
              aria-invalid={errors.title ? "true" : "false"}
            />
            <FieldError error={errors.title?.message} />
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
            isLoading={createBundle.isPending}
            loadingText="Creating..."
          >
            Create Bundle
          </LoadingButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/bundles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  );
}
