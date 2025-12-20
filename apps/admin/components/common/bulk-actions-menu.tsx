"use client";

import {
  Archive,
  CheckCircle,
  MoreHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "secondary";
  onClick: (selectedIds: string[]) => void | Promise<void>;
}

interface BulkActionsMenuProps<T extends { id: string }> {
  selectedItems: T[];
  actions: BulkAction[];
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  totalItems?: number;
  isLoading?: boolean;
}

/**
 * Bulk actions menu component
 * Provides a dropdown menu for bulk operations on selected items
 */
export function BulkActionsMenu<T extends { id: string }>({
  selectedItems,
  actions,
  onSelectAll,
  onDeselectAll,
  totalItems,
  isLoading = false,
}: BulkActionsMenuProps<T>) {
  const selectedCount = selectedItems.length;
  const allSelected = totalItems ? selectedCount === totalItems : false;
  const someSelected = selectedCount > 0;

  if (!someSelected && !onSelectAll) {
    return null;
  }

  const selectedIds = selectedItems.map((item) => item.id);

  return (
    <div className="flex items-center gap-2">
      {someSelected && (
        <Badge variant="secondary" className="mr-2">
          {selectedCount} selected
        </Badge>
      )}

      {onSelectAll && (
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectAll();
            } else {
              onDeselectAll?.();
            }
          }}
        />
      )}

      {someSelected && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Actions ({selectedCount})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => action.onClick(selectedIds)}
                className={
                  action.variant === "destructive" ? "text-destructive" : ""
                }
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * Predefined bulk actions for common operations
 */
export const commonBulkActions = {
  delete: (onDelete: (ids: string[]) => void | Promise<void>): BulkAction => ({
    id: "delete",
    label: "Delete",
    icon: <Trash2 className="h-4 w-4" />,
    variant: "destructive",
    onClick: onDelete,
  }),
  archive: (
    onArchive: (ids: string[]) => void | Promise<void>,
  ): BulkAction => ({
    id: "archive",
    label: "Archive",
    icon: <Archive className="h-4 w-4" />,
    onClick: onArchive,
  }),
  activate: (
    onActivate: (ids: string[]) => void | Promise<void>,
  ): BulkAction => ({
    id: "activate",
    label: "Activate",
    icon: <CheckCircle className="h-4 w-4" />,
    onClick: onActivate,
  }),
  deactivate: (
    onDeactivate: (ids: string[]) => void | Promise<void>,
  ): BulkAction => ({
    id: "deactivate",
    label: "Deactivate",
    icon: <XCircle className="h-4 w-4" />,
    onClick: onDeactivate,
  }),
};
