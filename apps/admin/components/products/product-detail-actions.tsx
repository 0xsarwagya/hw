"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, MoreVertical, Archive, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductDetailActionsProps {
  onPreview: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onSave: () => void;
  isSaving: boolean;
}

/**
 * Action buttons component for product detail page header
 */
export function ProductDetailActions({
  onPreview,
  onArchive,
  onDelete,
  onSave,
  isSaving,
}: ProductDetailActionsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>
      <Button variant="outline" onClick={onPreview}>
        <Eye className="mr-2 h-4 w-4" />
        Preview
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button onClick={onSave} disabled={isSaving}>
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>
    </div>
  );
}

