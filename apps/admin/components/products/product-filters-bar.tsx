"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ProductQueryParams, ProductStatus } from "@/lib/types/products";

interface ProductFiltersBarProps {
  filters: ProductQueryParams;
  onFiltersChange: (filters: ProductQueryParams) => void;
  onClear: () => void;
}

export function ProductFiltersBar({
  filters,
  onFiltersChange,
  onClear,
}: ProductFiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue || undefined, page: 1 });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const hasFilters =
    filters.status ||
    filters.categoryId ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.inStock !== undefined ||
    searchValue ||
    filters.sortBy;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
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
            status: value === "all" ? undefined : (value as ProductStatus),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.inStock === undefined ? "all" : filters.inStock ? "true" : "false"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            inStock: value === "all" ? undefined : value === "true",
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Stock" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="true">In Stock</SelectItem>
          <SelectItem value="false">Out of Stock</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        placeholder="Min price"
        value={filters.minPrice || ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
            page: 1,
          })
        }
        className="w-[120px]"
      />

      <Input
        type="number"
        placeholder="Max price"
        value={filters.maxPrice || ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
            page: 1,
          })
        }
        className="w-[120px]"
      />

      <Select
        value={filters.sortBy || "date"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            sortBy: value as "price" | "name" | "date",
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="price">Price</SelectItem>
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
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

