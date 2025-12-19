"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Folder } from "lucide-react";
import type { Category } from "@/lib/types/categories";

interface CategoryCardProps {
  category: Category;
  onDelete?: (id: string) => void;
}

export function CategoryCard({ category, onDelete }: CategoryCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <Link href={`/products/categories/${category.id}`}>
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Folder className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/products/categories/${category.id}`}>
              <h3 className="font-semibold hover:underline">{category.name}</h3>
            </Link>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
            {category.parentId && (
              <p className="text-xs text-muted-foreground mt-2">
                Subcategory
              </p>
            )}
            {category.productCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {category.productCount} product{category.productCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/products/categories/${category.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(category.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

