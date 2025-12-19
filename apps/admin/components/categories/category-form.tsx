"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/categories";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/lib/types/categories";
import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";
import { useAdminCategoryTree } from "@/hooks/categories/use-admin-categories";

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
  const [imageUrl, setImageUrl] = useState<string | null>(category?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const { data: categoryTree = [] } = useAdminCategoryTree();

  // Flatten category tree for select options (excluding current category and its descendants)
  const getAvailableParents = () => {
    const flatten = (cats: Category[], excludeId?: string): Category[] => {
      const result: Category[] = [];
      for (const cat of cats) {
        if (cat.id !== excludeId) {
          result.push(cat);
          if (cat.children && cat.children.length > 0) {
            result.push(...flatten(cat.children, excludeId));
          }
        }
      }
      return result;
    };
    return flatten(categoryTree, category?.id);
  };

  const form = useForm({
    resolver: zodResolver(category ? updateCategorySchema : createCategorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          parentId: category.parentId || undefined,
          description: category.description || undefined,
          imageUrl: category.imageUrl || undefined,
        }
      : {
          name: "",
          slug: "",
          parentId: undefined,
          description: "",
          imageUrl: undefined,
        },
  });

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", "categories");

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const uploadResponse = await fetch(`${API_URL}${endpoints.storage.upload}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      const url = uploadData.url || uploadData.key;
      setImageUrl(url);
      form.setValue("imageUrl", url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    form.setValue("imageUrl", undefined);
  };

  const handleSubmit = async (data: any) => {
    const submitData = category
      ? ({ ...data, parentId: data.parentId === null ? undefined : data.parentId } as UpdateCategoryInput)
      : (data as CreateCategoryInput);
    await onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
            <CardDescription>Basic category details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="category-slug" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to auto-generate from name
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No parent (top-level category)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No parent (top-level category)</SelectItem>
                      {getAvailableParents().map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Category description"
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Image</CardTitle>
            <CardDescription>Upload an image for this category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageUrl ? (
              <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Category image"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    disabled={isUploading}
                  />
                </label>
              </div>
            )}
            {isUploading && (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : category ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

