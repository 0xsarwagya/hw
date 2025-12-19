"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { UpdateProductFormValues } from "@/lib/validations/products";
import type { Category } from "@/lib/types/categories";

interface ProductCategoriesTabProps {
  form: UseFormReturn<UpdateProductFormValues>;
  allCategories: Category[];
}

/**
 * Categories tab component for product editing
 * Manages product category assignment
 */
export function ProductCategoriesTab({
  form,
  allCategories,
}: ProductCategoriesTabProps) {
  if (allCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Assign this product to a category</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/products/categories/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No categories available</p>
            <Button asChild variant="outline">
              <Link href="/products/categories/create">Create Category</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedCategory = allCategories.find(
    (c) => c.id === form.watch("categoryId")
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Assign this product to a category</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/products/categories/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Category</label>
            <Select
              value={form.watch("categoryId") || "none"}
              onValueChange={(value: string) =>
                form.setValue("categoryId", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {selectedCategory.name}
                    </span>
                  </div>
                  {selectedCategory.slug && (
                    <div>
                      <span className="text-sm font-medium">Slug:</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {selectedCategory.slug}
                      </span>
                    </div>
                  )}
                  {selectedCategory.description && (
                    <div>
                      <span className="text-sm font-medium">Description:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedCategory.description}
                      </p>
                    </div>
                  )}
                  {selectedCategory.imageUrl && (
                    <div>
                      <span className="text-sm font-medium">Image:</span>
                      <div className="mt-2">
                        <img
                          src={selectedCategory.imageUrl}
                          alt={selectedCategory.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

