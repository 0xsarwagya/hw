"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface TableActionsDropdownProps {
  editHref?: string;
  onEdit?: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  variant?: "default" | "destructive";
}

/**
 * Reusable table row actions dropdown component
 * Provides consistent edit/delete actions for table rows
 */
export function TableActionsDropdown({
  editHref,
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  variant = "default",
}: TableActionsDropdownProps) {
  const editContent = editHref ? (
    <DropdownMenuItem asChild>
      <Link href={editHref}>
        <Edit className="mr-2 h-4 w-4" />
        {editLabel}
      </Link>
    </DropdownMenuItem>
  ) : onEdit ? (
    <DropdownMenuItem onClick={onEdit}>
      <Edit className="mr-2 h-4 w-4" />
      {editLabel}
    </DropdownMenuItem>
  ) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {editContent}
        <DropdownMenuItem
          onClick={onDelete}
          className={variant === "destructive" ? "text-destructive" : ""}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

