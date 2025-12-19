"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CollectionQueryParams } from "@/lib/types/collections";

interface CollectionsFiltersBarProps {
  filters: CollectionQueryParams;
  onFiltersChange: (filters: CollectionQueryParams) => void;
  onClear: () => void;
}

export function CollectionsFiltersBar({
  filters,
  onFiltersChange,
  onClear,
}: CollectionsFiltersBarProps) {
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
          placeholder="Search collections..."
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
