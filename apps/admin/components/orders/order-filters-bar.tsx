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
import { DateRangePicker } from "./date-range-picker";
import type { OrderStatus } from "@/lib/types/orders";

interface OrderFiltersBarProps {
  status?: OrderStatus;
  search?: string;
  dateRange?: { from?: Date; to?: Date };
  onStatusChange: (status: OrderStatus | undefined) => void;
  onSearchChange: (search: string) => void;
  onDateRangeChange: (range: { from?: Date; to?: Date } | undefined) => void;
  onClear: () => void;
}

export function OrderFiltersBar({
  status,
  search,
  dateRange,
  onStatusChange,
  onSearchChange,
  onDateRangeChange,
  onClear,
}: OrderFiltersBarProps) {
  const [searchValue, setSearchValue] = useState(search || "");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  const hasFilters = status || searchValue || dateRange?.from || dateRange?.to;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by order ID, customer email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={status || "all"} onValueChange={(value) => onStatusChange(value === "all" ? undefined : (value as OrderStatus))}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>

      <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

