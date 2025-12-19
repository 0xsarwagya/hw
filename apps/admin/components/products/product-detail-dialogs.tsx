"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ProductDetailDialogsProps {
  archiveDialogOpen: boolean;
  onArchiveDialogChange: (open: boolean) => void;
  onArchiveConfirm: () => void;
  deleteProductDialogOpen: boolean;
  onDeleteProductDialogChange: (open: boolean) => void;
  onDeleteProductConfirm: () => void;
  deleteVariantDialogOpen: boolean;
  onDeleteVariantDialogChange: (open: boolean) => void;
  onDeleteVariantConfirm: () => void;
  isUpdating: boolean;
  isDeletingProduct: boolean;
  isDeletingVariant: boolean;
}

/**
 * Dialogs component for product detail page
 * Manages all confirmation dialogs (archive, delete product, delete variant)
 */
export function ProductDetailDialogs({
  archiveDialogOpen,
  onArchiveDialogChange,
  onArchiveConfirm,
  deleteProductDialogOpen,
  onDeleteProductDialogChange,
  onDeleteProductConfirm,
  deleteVariantDialogOpen,
  onDeleteVariantDialogChange,
  onDeleteVariantConfirm,
  isUpdating,
  isDeletingProduct,
  isDeletingVariant,
}: ProductDetailDialogsProps) {
  return (
    <>
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={onArchiveDialogChange}
        title="Archive Product"
        description="Are you sure you want to archive this product? It will be hidden from the storefront but can be restored later."
        confirmText="Archive"
        onConfirm={onArchiveConfirm}
        isLoading={isUpdating}
      />

      <ConfirmDialog
        open={deleteProductDialogOpen}
        onOpenChange={onDeleteProductDialogChange}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone. All variants and images will also be deleted."
        confirmText="Delete"
        variant="destructive"
        onConfirm={onDeleteProductConfirm}
        isLoading={isDeletingProduct}
      />

      <ConfirmDialog
        open={deleteVariantDialogOpen}
        onOpenChange={onDeleteVariantDialogChange}
        title="Delete Variant"
        description="Are you sure you want to delete this variant? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={onDeleteVariantConfirm}
        isLoading={isDeletingVariant}
      />
    </>
  );
}
