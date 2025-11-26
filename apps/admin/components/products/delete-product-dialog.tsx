"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteProduct } from "@/hooks/use-product-mutations";

type Props = {
  productId: string;
  onClose: () => void;
};

export function DeleteProductDialog({ productId, onClose }: Props) {
  const deleteProduct = useDeleteProduct();

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(productId);
      onClose();
    } catch (_error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Dialog open={!!productId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this product? This action cannot be
            undone. All variants and images associated with this product will
            also be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteProduct.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
          >
            {deleteProduct.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
