"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { useAdminCategory } from "@/hooks/categories/use-admin-categories";
import { useAdminUpdateCategory } from "@/hooks/categories/use-admin-update-category";
import { BREADCRUMB_LABELS, ROUTES } from "@/lib/constants/routes.constants";
import type { UpdateCategoryInput } from "@/lib/types/categories";
import { CategoryForm } from "./category-form";

export function CategoryDetailPageClient() {
  const params = useParams();
  const _router = useRouter();
  const categoryId = params.categoryId as string;

  const { data: category, isLoading: isLoadingCategory } =
    useAdminCategory(categoryId);
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
            <Link href={ROUTES.PRODUCTS.CATEGORIES.LIST}>
              Back to Categories
            </Link>
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
        { label: BREADCRUMB_LABELS.PRODUCTS, href: ROUTES.PRODUCTS.LIST },
        {
          label: BREADCRUMB_LABELS.CATEGORIES,
          href: ROUTES.PRODUCTS.CATEGORIES.LIST,
        },
        { label: category.name },
      ]}
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.PRODUCTS.CATEGORIES.LIST}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
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
