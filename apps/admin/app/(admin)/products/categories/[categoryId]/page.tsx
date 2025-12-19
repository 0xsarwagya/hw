"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { CategoryForm } from "@/components/categories/category-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAdminCategory } from "@/hooks/categories/use-admin-categories";
import { useAdminUpdateCategory } from "@/hooks/categories/use-admin-update-category";
import type { UpdateCategoryInput } from "@/lib/types/categories";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;

  const { data: category, isLoading: isLoadingCategory } = useAdminCategory(categoryId);
  const updateCategory = useAdminUpdateCategory(categoryId);

  const handleSubmit = async (data: UpdateCategoryInput) => {
    await updateCategory.mutateAsync(data);
  };

  if (isLoadingCategory) {
    return (
      <AdminPageLayout title="Category" description="Loading...">
        <div className="space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminPageLayout>
    );
  }

  if (!category) {
    return (
      <AdminPageLayout title="Category" description="Category not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Category not found</p>
          <Button asChild className="mt-4">
            <Link href="/products/categories">Back to Categories</Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={category.name}
      description="Edit category details"
      breadcrumbs={[
        { label: "Products", href: "/products" },
        { label: "Categories", href: "/products/categories" },
        { label: category.name },
      ]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/products/categories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      }
    >
      <CategoryForm
        category={category}
        onSubmit={handleSubmit}
        isLoading={updateCategory.isPending}
      />
    </AdminPageLayout>
  );
}

