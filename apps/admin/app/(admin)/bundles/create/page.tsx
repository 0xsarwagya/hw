"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BundleSetsManager } from "@/components/bundles/bundle-sets-manager";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorDisplay } from "@/components/ui/error-display";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminCreateBundle } from "@/hooks/bundles/use-admin-create-bundle";
import type { FetchError } from "@/lib/api";
import type { CreateBundleInput } from "@/lib/types/bundles";

export default function CreateBundlePage() {
  const router = useRouter();
  const createBundle = useAdminCreateBundle();
  const [apiError, setApiError] = useState<FetchError | null>(null);
  const [createdBundleId, setCreatedBundleId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<CreateBundleInput>({
    defaultValues: {
      isActive: true,
      allowMixAndMatch: false,
    },
  });

  const isActive = watch("isActive");
  const allowMixAndMatch = watch("allowMixAndMatch");

  const onSubmit = async (data: CreateBundleInput) => {
    setApiError(null);
    try {
      const bundle = await createBundle.mutateAsync(data);
      setCreatedBundleId(bundle.id);
      // Don't redirect immediately - allow user to add sets first
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

  const handleContinue = () => {
    if (createdBundleId) {
      router.push(`/bundles/${createdBundleId}`);
    }
  };

  return (
    <AdminPageLayout
      title="Create Bundle"
      description="Create a new product bundle with choice sets"
      breadcrumbs={[
        { label: "Bundles", href: "/bundles" },
        { label: "Create" },
      ]}
    >
      {apiError && (
        <ErrorDisplay error={apiError} onRetry={() => setApiError(null)} />
      )}

      {createdBundleId ? (
        <div className="space-y-6">
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                Bundle Created Successfully!
              </CardTitle>
              <CardDescription className="text-green-800 dark:text-green-200">
                Now you can add choice sets and product variants to your bundle.
              </CardDescription>
            </CardHeader>
          </Card>

          <BundleSetsManager bundleId={createdBundleId} />

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/bundles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bundles
              </Link>
            </Button>
            <Button onClick={handleContinue}>View Bundle Details</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide basic details about your bundle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
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
                  placeholder="Optional description for your bundle"
                  aria-invalid={errors.description ? "true" : "false"}
                />
                <FieldError error={errors.description?.message} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure bundle behavior and options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-base">
                    Active
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Only active bundles are visible to customers
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    setValue("isActive", checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="allowMixAndMatch" className="text-base">
                    Allow Mix and Match
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to mix variants from the same product across
                    different sets
                  </p>
                </div>
                <Switch
                  id="allowMixAndMatch"
                  checked={allowMixAndMatch}
                  onCheckedChange={(checked) => {
                    setValue("allowMixAndMatch", checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>

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
      )}
    </AdminPageLayout>
  );
}
