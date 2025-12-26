"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/types/categories";
import {
  type CreateCategoryInput as CreateCategoryInputSchema,
  createCategorySchema,
  type UpdateCategoryInput as UpdateCategoryInputSchema,
  updateCategorySchema,
} from "@/lib/validations/categories";
import { CategoryBasicFields } from "./category-basic-fields";
import { CategoryImageUpload } from "./category-image-upload";

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
}: CategoryFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    category?.imageUrl || null,
  );
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm({
    resolver: zodResolver(
      category ? updateCategorySchema : createCategorySchema,
    ),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          parentId: category.parentId || undefined,
          description: category.description || undefined,
          imageUrl: category.imageUrl || undefined,
          position: category.position,
        }
      : {
          name: "",
          slug: "",
          parentId: undefined,
          description: "",
          imageUrl: undefined,
          position: undefined,
        },
  });

  const handleSubmit = async (
    data: CreateCategoryInputSchema | UpdateCategoryInputSchema,
  ) => {
    // Remove position field as backend DTO doesn't accept it
    const { position, ...dataWithoutPosition } = data;
    await onSubmit(dataWithoutPosition as CreateCategoryInput | UpdateCategoryInput);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <CategoryBasicFields form={form} category={category} />

        <CategoryImageUpload
          form={form}
          imageUrl={imageUrl}
          isUploading={isUploading}
          onImageChange={setImageUrl}
          onUploadingChange={setIsUploading}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : category
                ? "Update Category"
                : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
