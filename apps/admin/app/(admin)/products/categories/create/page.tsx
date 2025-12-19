"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { CategoryForm } from "@/components/categories/category-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAdminCreateCategory } from "@/hooks/categories/use-admin-create-category";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/types/categories";

export default function CreateCategoryPage() {
  const router = useRouter();
  const createCategory = useAdminCreateCategory();

  const handleSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    await createCategory.mutateAsync(data as CreateCategoryInput);
    router.push("/products/categories");
  };

  const handleCancel = () => {
    router.push("/products/categories");
  };

  return (
    <AdminPageLayout
      title="Create Category"
      description="Create a new product category"
      breadcrumbs={[
        { label: "Products", href: "/products" },
        { label: "Categories", href: "/products/categories" },
        { label: "Create" },
      ]}
      actions={
        <Button variant="outline" asChild>
          <Link href="/products/categories">
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

