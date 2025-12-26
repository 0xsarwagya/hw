"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BundlePreviewCard } from "@/components/bundles/bundle-preview-card";
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
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminBundle } from "@/hooks/bundles/use-admin-bundle";
import { useAdminCreateBundle } from "@/hooks/bundles/use-admin-create-bundle";
import type { FetchError } from "@/lib/api";
import type { CreateBundleInput } from "@/lib/types/bundles";

type WizardStep = "basic" | "sets" | "review";

const steps: { id: WizardStep; title: string; description: string }[] = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Provide basic details about your bundle",
  },
  {
    id: "sets",
    title: "Add Choice Sets",
    description: "Create sets and add product variants",
  },
  {
    id: "review",
    title: "Review & Preview",
    description: "Review your bundle before finalizing",
  },
];

interface BundleCreationWizardProps {
  onComplete?: (bundleId: string) => void;
}

/**
 * Step-by-step bundle creation wizard
 */
export function BundleCreationWizard({
  onComplete,
}: BundleCreationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("basic");
  const [createdBundleId, setCreatedBundleId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<FetchError | null>(null);

  const createBundle = useAdminCreateBundle();
  const { data: bundle } = useAdminBundle(
    createdBundleId || "",
    !!createdBundleId,
  );

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
  const title = watch("title");
  const description = watch("description");

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const onSubmit = async (data: CreateBundleInput) => {
    setApiError(null);
    try {
      const bundle = await createBundle.mutateAsync(data);
      setCreatedBundleId(bundle.id);
      setCurrentStep("sets");
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

  const handleNext = () => {
    if (currentStep === "basic") {
      handleSubmit(onSubmit)();
    } else if (currentStep === "sets") {
      setCurrentStep("review");
    }
  };

  const handlePrevious = () => {
    if (currentStep === "sets") {
      setCurrentStep("basic");
    } else if (currentStep === "review") {
      setCurrentStep("sets");
    }
  };

  const handleFinish = () => {
    if (createdBundleId) {
      onComplete?.(createdBundleId);
      router.push(`/bundles/${createdBundleId}`);
    }
  };

  const canProceed = () => {
    if (currentStep === "basic") {
      return title && title.trim().length > 0;
    }
    if (currentStep === "sets") {
      return bundle && (bundle.sets?.length || 0) > 0;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center gap-1 flex-1"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? "bg-green-600 text-white"
                          : isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="text-xs text-center mt-1">
                      <div
                        className={
                          isCurrent ? "font-medium" : "text-muted-foreground"
                        }
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {apiError && (
        <ErrorDisplay error={apiError} onRetry={() => setApiError(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {currentStep === "basic" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{steps[0].title}</CardTitle>
                  <CardDescription>{steps[0].description}</CardDescription>
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
                        Allow customers to mix variants from the same product
                        across different sets
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
            </form>
          )}

          {currentStep === "sets" && createdBundleId && (
            <Card>
              <CardHeader>
                <CardTitle>{steps[1].title}</CardTitle>
                <CardDescription>{steps[1].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <BundleSetsManager bundleId={createdBundleId} />
              </CardContent>
            </Card>
          )}

          {currentStep === "review" && bundle && (
            <Card>
              <CardHeader>
                <CardTitle>{steps[2].title}</CardTitle>
                <CardDescription>{steps[2].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Review your bundle details below. You can go back to make
                    changes or finish to view the bundle.
                  </p>
                  {bundle.sets && bundle.sets.length === 0 && (
                    <div className="rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        ⚠️ Your bundle doesn't have any choice sets yet. Go back
                        to add sets and variants.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {(title || bundle) && (
            <BundlePreviewCard
              bundle={
                bundle || {
                  id: "",
                  title: title || "",
                  description: description || null,
                  isActive: isActive ?? false,
                  allowMixAndMatch: allowMixAndMatch ?? false,
                  sets: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              }
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {currentStep !== "basic" && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={createBundle.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
          {currentStep === "basic" && (
            <Button type="button" variant="outline" asChild>
              <Link href="/bundles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {currentStep === "review" ? (
            <LoadingButton onClick={handleFinish} disabled={!createdBundleId}>
              Finish & View Bundle
            </LoadingButton>
          ) : (
            <LoadingButton
              onClick={handleNext}
              disabled={!canProceed() || createBundle.isPending}
              isLoading={createBundle.isPending}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </LoadingButton>
          )}
        </div>
      </div>
    </div>
  );
}
