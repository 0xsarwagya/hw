"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { ProductDetailSkeleton } from "@/components/skeletons/product-detail-skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, MoreVertical, Archive, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminProduct } from "@/hooks/products/use-admin-product";
import { useAdminUpdateProduct } from "@/hooks/products/use-admin-update-product";
import { useAdminDeleteProduct } from "@/hooks/products/use-admin-delete-product";
import { useAdminVariants } from "@/hooks/products/use-admin-variants";
import { useAdminDeleteVariant } from "@/hooks/products/use-admin-delete-variant";
import { useAdminProductImages } from "@/hooks/products/use-admin-product-images";
import { useAdminProductCollections } from "@/hooks/products/use-admin-product-collections";
import { useAdminCollections } from "@/hooks/collections/use-admin-collections";
import { useAdminToggleProductCollection } from "@/hooks/collections/use-admin-toggle-product-collection";
import { useAdminCategories } from "@/hooks/categories/use-admin-categories";
import { updateProductFormSchema } from "@/lib/validations/products";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UpdateProductInput, UpdateProductFormValues } from "@/lib/validations/products";
import { ProductDetailTabs } from "./product-detail-tabs";
import { ProductDetailSummary } from "./product-detail-summary";
import { ProductDetailActions } from "./product-detail-actions";
import { ProductDetailDialogs } from "./product-detail-dialogs";
import { ProductNotFoundState } from "./product-not-found-state";
import dynamic from "next/dynamic";

const ProductPreviewModal = dynamic(
  () =>
    import("@/components/products/product-preview-modal").then((mod) => ({
      default: mod.ProductPreviewModal,
    })),
  { loading: () => null }
);

interface ProductDetailClientProps {
  productId: string;
}

/**
 * Client component for product detail page
 * Handles all client-side logic including form management, state, and interactions
 */
export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const router = useRouter();

  const { data: product, isLoading: isLoadingProduct } = useAdminProduct(productId);
  const { data: variants } = useAdminVariants(productId);
  const { data: images } = useAdminProductImages(productId);
  const { data: productCollections } = useAdminProductCollections(productId);
  const { data: allCollectionsData } = useAdminCollections({ limit: 100 });
  const { data: allCategoriesData } = useAdminCategories({ limit: 100 });
  const updateProduct = useAdminUpdateProduct(productId);
  const deleteProduct = useAdminDeleteProduct();
  const deleteVariant = useAdminDeleteVariant(productId);
  const { addToCollection, removeFromCollection } = useAdminToggleProductCollection(productId);

  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [deleteVariantDialogOpen, setDeleteVariantDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (productCollections) {
      setSelectedCollectionIds(new Set(productCollections.map((c) => c.id)));
    }
  }, [productCollections]);

  const form = useForm<UpdateProductFormValues>({
    resolver: zodResolver(updateProductFormSchema),
    values: product
      ? {
          title: product.title,
          description: product.description || undefined,
          price: product.price,
          gstRate: product.gstRate.toString() as "0" | "5" | "12" | "18" | "28" | undefined,
          hsnCode: product.hsnCode || undefined,
          status: product.status,
          categoryId: product.categoryId || null,
        }
      : undefined,
  });

  const handleSubmit = async (data: UpdateProductFormValues) => {
    const apiData: UpdateProductInput = {
      ...data,
      gstRate: data.gstRate ? parseInt(data.gstRate, 10) : undefined,
      categoryId: data.categoryId === null ? undefined : data.categoryId,
    };
    await updateProduct.mutateAsync(apiData);
  };

  const handleCollectionToggle = async (collectionId: string, checked: boolean) => {
    if (checked) {
      try {
        await addToCollection.mutateAsync({ collectionId });
        setSelectedCollectionIds((prev) => new Set([...prev, collectionId]));
      } catch (error) {
        // Error handled by hook
      }
    } else {
      try {
        await removeFromCollection.mutateAsync({ collectionId });
        setSelectedCollectionIds((prev) => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleDeleteVariantClick = (variantId: string) => {
    setVariantToDelete(variantId);
    setDeleteVariantDialogOpen(true);
  };

  const handleDeleteVariantConfirm = async () => {
    if (variantToDelete) {
      await deleteVariant.mutateAsync(variantToDelete);
      setVariantToDelete(null);
    }
  };

  const handleArchiveConfirm = async () => {
    await updateProduct.mutateAsync({ status: "archived" });
  };

  const handleDeleteConfirm = async () => {
    await deleteProduct.mutateAsync(productId);
  };

  if (isLoadingProduct) {
    return (
      <AdminPageLayout title="Product" description="Loading...">
        <ProductDetailSkeleton />
      </AdminPageLayout>
    );
  }

  if (!product) {
    return <ProductNotFoundState />;
  }

  const allCollections = allCollectionsData?.data || [];
  const allCategories = allCategoriesData || [];

  return (
    <AdminPageLayout
      title={product.title}
      description="Edit product details"
      breadcrumbs={[
        { label: "Products", href: "/products" },
        { label: product.title },
      ]}
      actions={
        <ProductDetailActions
          onPreview={() => setPreviewOpen(true)}
          onArchive={() => setArchiveDialogOpen(true)}
          onDelete={() => setDeleteProductDialogOpen(true)}
          onSave={() => form.handleSubmit(handleSubmit)()}
          isSaving={updateProduct.isPending}
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProductDetailTabs
            productId={productId}
            form={form}
            variants={variants || []}
            images={images || []}
            allCategories={allCategories}
            allCollections={allCollections}
            selectedCollectionIds={selectedCollectionIds}
            onCollectionToggle={handleCollectionToggle}
            onDeleteVariant={handleDeleteVariantClick}
          />
        </div>

        <ProductDetailSummary
          product={product}
          variants={variants || []}
        />
      </div>

      <ProductPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        product={product}
        images={images || []}
        variants={variants || []}
        collections={productCollections || []}
      />

      <ProductDetailDialogs
        archiveDialogOpen={archiveDialogOpen}
        onArchiveDialogChange={setArchiveDialogOpen}
        onArchiveConfirm={handleArchiveConfirm}
        deleteProductDialogOpen={deleteProductDialogOpen}
        onDeleteProductDialogChange={setDeleteProductDialogOpen}
        onDeleteProductConfirm={handleDeleteConfirm}
        deleteVariantDialogOpen={deleteVariantDialogOpen}
        onDeleteVariantDialogChange={setDeleteVariantDialogOpen}
        onDeleteVariantConfirm={handleDeleteVariantConfirm}
        isUpdating={updateProduct.isPending}
        isDeletingProduct={deleteProduct.isPending}
        isDeletingVariant={deleteVariant.isPending}
      />
    </AdminPageLayout>
  );
}

