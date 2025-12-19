"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Category } from "@/lib/types/categories";
import { cn } from "@/lib/utils";

interface CategoryTreeViewProps {
  categories: Category[];
  onDelete?: (categoryId: string) => void;
}

function CategoryTreeItem({
  category,
  level = 0,
  onDelete,
}: {
  category: Category;
  level?: number;
  onDelete?: (categoryId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="select-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent",
            level > 0 && "ml-4",
          )}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(!isOpen);
                }}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="h-6 w-6" /> // Spacer for alignment
          )}
          <Link
            href={`/products/categories/${category.id}`}
            className="flex-1 text-sm font-medium hover:underline"
          >
            {category.name}
          </Link>
          {category.productCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              {category.productCount} products
            </span>
          )}
          {category.position !== undefined && (
            <span className="text-xs text-muted-foreground">
              Position: {category.position}
            </span>
          )}
        </div>
        {hasChildren && (
          <CollapsibleContent className="space-y-1">
            {category.children?.map((child) => (
              <CategoryTreeItem
                key={child.id}
                category={child}
                level={level + 1}
                onDelete={onDelete}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function CategoryTreeView({
  categories,
  onDelete,
}: CategoryTreeViewProps) {
  // Build tree structure from flat list
  const buildTree = (items: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // Create map of all categories
    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    // Build tree
    items.forEach((item) => {
      const node = map.get(item.id);
      if (!node) return;

      if (item.parentId) {
        const parent = map.get(item.parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort by position
    const sortByPosition = (nodes: Category[]): Category[] => {
      return nodes
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((node) => ({
          ...node,
          children: node.children ? sortByPosition(node.children) : undefined,
        }));
    };

    return sortByPosition(roots);
  };

  const tree = buildTree(categories);

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No categories found
      </div>
    );
  }

  return (
    <div className="space-y-1 border rounded-lg p-2">
      {tree.map((category) => (
        <CategoryTreeItem
          key={category.id}
          category={category}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
