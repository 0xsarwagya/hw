import { useCallback, useState } from "react";

interface UseDeleteConfirmationReturn {
  deleteDialogOpen: boolean;
  itemToDelete: string | null;
  handleDeleteClick: (id: string) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

/**
 * Hook for managing delete confirmation dialog state
 * Provides consistent delete confirmation pattern across the application
 *
 * @param onDelete - Callback function to execute when delete is confirmed
 * @returns Object with dialog state and handlers
 *
 * @example
 * ```tsx
 * const deleteMutation = useAdminDeleteProduct();
 * const {
 *   deleteDialogOpen,
 *   itemToDelete,
 *   handleDeleteClick,
 *   handleDeleteConfirm,
 *   handleDeleteCancel,
 * } = useDeleteConfirmation(async (id) => {
 *   await deleteMutation.mutateAsync(id);
 * });
 *
 * <ConfirmDialog
 *   open={deleteDialogOpen}
 *   onOpenChange={handleDeleteCancel}
 *   onConfirm={handleDeleteConfirm}
 *   ...
 * />
 * ```
 */
export function useDeleteConfirmation(
  onDelete: (id: string) => Promise<void>,
): UseDeleteConfirmationReturn {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDeleteClick = useCallback((id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (itemToDelete) {
      await onDelete(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }, []);

  return {
    deleteDialogOpen,
    itemToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    setDeleteDialogOpen,
  };
}
