"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { useAdminCreateCategory } from "@/hooks/categories/use-admin-create-category";
import { BREADCRUMB_LABELS, ROUTES } from "@/lib/constants/routes.constants";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/types/categories";
import { CategoryForm } from "./category-form";

export function CategoryFormPageClient() {
  const router = useRouter();
  const createCategory = useAdminCreateCategory();

  const handleSubmit = async (
    data: CreateCategoryInput | UpdateCategoryInput,
  ) => {
    await createCategory.mutateAsync(data as CreateCategoryInput);
    router.push(ROUTES.PRODUCTS.CATEGORIES.LIST);
  };

  const handleCancel = () => {
    router.push(ROUTES.PRODUCTS.CATEGORIES.LIST);
  };

  return (
    <AdminPageLayout
      title={BREADCRUMB_LABELS.CREATE_CATEGORY}
      description="Create a new product category"
      breadcrumbs={[
        { label: BREADCRUMB_LABELS.PRODUCTS, href: ROUTES.PRODUCTS.LIST },
        {
          label: BREADCRUMB_LABELS.CATEGORIES,
          href: ROUTES.PRODUCTS.CATEGORIES.LIST,
        },
        { label: BREADCRUMB_LABELS.CREATE_CATEGORY },
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
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createCategory.isPending}
      />
    </AdminPageLayout>
  );
}
