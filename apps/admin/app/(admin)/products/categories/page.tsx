"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { CategoriesFiltersBar } from "@/components/categories/categories-filters-bar";
import { CategoryCard } from "@/components/categories/category-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAdminCategories } from "@/hooks/categories/use-admin-categories";
import { useAdminDeleteCategory } from "@/hooks/categories/use-admin-delete-category";
import type { CategoryQueryParams } from "@/lib/types/categories";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deleteCategory = useAdminDeleteCategory();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [filters, setFilters] = useState<CategoryQueryParams>({
    search: searchParams.get("search") || undefined,
  });

  const { data: categories = [], isLoading, error } = useAdminCategories(filters);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);

    router.replace(`/products/categories?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      await deleteCategory.mutateAsync(categoryToDelete);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: undefined,
    });
  };

  if (isLoading) {
    return (
      <AdminPageLayout title="Categories" description="Manage product categories">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    toast.error(error.message || "Failed to load categories");
    return (
      <AdminPageLayout title="Categories" description="Manage product categories">
        <div className="text-center py-8 text-destructive">
          Error loading categories: {error.message}
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <>
      <AdminPageLayout
        title="Categories"
        description="Manage product categories"
        actions={
          <Button asChild>
            <Link href="/products/categories/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Link>
          </Button>
        }
        filters={
          <CategoriesFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
          />
        }
      >
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg font-medium mb-2">No categories found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.search ? "Try adjusting your search" : "Create your first category to get started"}
            </p>
            {!filters.search && (
              <Button asChild>
                <Link href="/products/categories/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </Link>
              </Button>
            )}
          </div>
        )}
      </AdminPageLayout>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description="Are you sure you want to delete this category? Products will remain but will be removed from this category."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}

