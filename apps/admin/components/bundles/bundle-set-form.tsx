"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";
import type { CreateBundleSetInput } from "@/lib/types/bundles";

interface BundleSetFormProps {
  initialData?: Partial<CreateBundleSetInput>;
  onSubmit: (data: CreateBundleSetInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function BundleSetForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Set",
}: BundleSetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateBundleSetInput>({
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      minQuantity: initialData?.minQuantity ?? 1,
      maxQuantity: initialData?.maxQuantity ?? 1,
    },
  });

  const minQuantity = watch("minQuantity");
  const maxQuantity = watch("maxQuantity");

  const handleFormSubmit = async (data: CreateBundleSetInput) => {
    // Validate minQuantity <= maxQuantity
    if (data.minQuantity > data.maxQuantity) {
      return;
    }
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          {...register("title", {
            required: "Title is required",
            minLength: {
              value: 1,
              message: "Title must be at least 1 character",
            },
          })}
          placeholder="Choose your T-shirt"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="minQuantity">
            Min Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="minQuantity"
            type="number"
            min="0"
            max="15"
            {...register("minQuantity", {
              required: "Min quantity is required",
              valueAsNumber: true,
              min: { value: 0, message: "Min quantity must be at least 0" },
              max: { value: 15, message: "Min quantity must be at most 15" },
              validate: (value) => {
                const max = watch("maxQuantity");
                if (value > max) {
                  return "Min quantity must be less than or equal to max quantity";
                }
                return true;
              },
            })}
            aria-invalid={errors.minQuantity ? "true" : "false"}
          />
          <FieldError error={errors.minQuantity?.message} />
          <p className="text-xs text-muted-foreground">
            Minimum items customer must select (0-15)
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maxQuantity">
            Max Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="maxQuantity"
            type="number"
            min="1"
            max="15"
            {...register("maxQuantity", {
              required: "Max quantity is required",
              valueAsNumber: true,
              min: { value: 1, message: "Max quantity must be at least 1" },
              max: { value: 15, message: "Max quantity must be at most 15" },
              validate: (value) => {
                const min = watch("minQuantity");
                if (value < min) {
                  return "Max quantity must be greater than or equal to min quantity";
                }
                return true;
              },
            })}
            aria-invalid={errors.maxQuantity ? "true" : "false"}
          />
          <FieldError error={errors.maxQuantity?.message} />
          <p className="text-xs text-muted-foreground">
            Maximum items customer can select (1-15)
          </p>
        </div>
      </div>

      {minQuantity > maxQuantity && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Min quantity must be less than or equal to max quantity
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <LoadingButton type="submit" isLoading={isLoading}>
          {submitLabel}
        </LoadingButton>
      </div>
    </form>
  );
}
