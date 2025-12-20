"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { InventoryQueryParams } from "@/lib/types/inventory";

interface InventoryFiltersBarProps {
  filters: InventoryQueryParams;
  onFiltersChange: (filters: InventoryQueryParams) => void;
  onClear: () => void;
}

/**
 * Filter bar component for inventory list
 * Includes search, status, stock filters, category, and sorting
 */
export function InventoryFiltersBar({
  filters,
  onFiltersChange,
  onClear,
}: InventoryFiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: searchValue || undefined,
        page: 1,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  const hasFilters =
    filters.status ||
    filters.lowStock ||
    filters.outOfStock ||
    filters.categoryId ||
    searchValue ||
    filters.sortBy !== "updatedAt" ||
    filters.sortOrder !== "desc";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by SKU or product title..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status:
              value === "all"
                ? undefined
                : (value as InventoryQueryParams["status"]),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Switch
          id="low-stock"
          checked={filters.lowStock || false}
          onCheckedChange={(checked) =>
            onFiltersChange({
              ...filters,
              lowStock: checked || undefined,
              page: 1,
            })
          }
        />
        <Label htmlFor="low-stock" className="text-sm cursor-pointer">
          Low Stock
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="out-of-stock"
          checked={filters.outOfStock || false}
          onCheckedChange={(checked) =>
            onFiltersChange({
              ...filters,
              outOfStock: checked || undefined,
              page: 1,
            })
          }
        />
        <Label htmlFor="out-of-stock" className="text-sm cursor-pointer">
          Out of Stock
        </Label>
      </div>

      <Select
        value={filters.sortBy || "updatedAt"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            sortBy: value as InventoryQueryParams["sortBy"],
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updatedAt">Last Updated</SelectItem>
          <SelectItem value="inventory">Inventory</SelectItem>
          <SelectItem value="committed">Committed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.sortOrder || "desc"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            sortOrder: value as "asc" | "desc",
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Descending</SelectItem>
          <SelectItem value="asc">Ascending</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
