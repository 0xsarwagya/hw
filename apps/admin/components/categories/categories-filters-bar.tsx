"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoryQueryParams } from "@/lib/types/categories";

interface CategoriesFiltersBarProps {
  filters: CategoryQueryParams;
  onFiltersChange: (filters: CategoryQueryParams) => void;
  onClear: () => void;
}

export function CategoriesFiltersBar({
  filters,
  onFiltersChange,
  onClear,
}: CategoriesFiltersBarProps) {
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
  }, [searchValue, onFiltersChange, filters]);

  const hasActiveFilters = filters.search;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
