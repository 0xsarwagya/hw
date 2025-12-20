"use client";

import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminFetchAdmins } from "@/hooks/activity-logs/use-admin-fetch-admins";
import type { ActivityLogQueryParams } from "@/lib/types/activity-logs";
import { cn } from "@/lib/utils";

interface ActivityLogsFiltersProps {
  filters: ActivityLogQueryParams;
  onFiltersChange: (filters: ActivityLogQueryParams) => void;
  onClear: () => void;
}

const RESOURCE_OPTIONS = [
  { value: "product", label: "Product" },
  { value: "order", label: "Order" },
  { value: "customer", label: "Customer" },
  { value: "discount", label: "Discount" },
  { value: "bundle", label: "Bundle" },
  { value: "collection", label: "Collection" },
  { value: "category", label: "Category" },
  { value: "auth", label: "Auth" },
] as const;

const ACTION_OPTIONS = [
  { value: "product.create", label: "Product Created" },
  { value: "product.update", label: "Product Updated" },
  { value: "product.delete", label: "Product Deleted" },
  { value: "order.create", label: "Order Created" },
  { value: "order.update", label: "Order Updated" },
  { value: "admin.login", label: "Login" },
  { value: "admin.logout", label: "Logout" },
  { value: "admin.session.revoke", label: "Session Revoked" },
] as const;

export function ActivityLogsFilters({
  filters,
  onFiltersChange,
  onClear,
}: ActivityLogsFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined,
  );

  const { data: admins = [] } = useAdminFetchAdmins();

  // Use refs to track latest values without causing re-renders
  const filtersRef = useRef(filters);
  const onFiltersChangeRef = useRef(onFiltersChange);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChangeRef.current({
        ...filtersRef.current,
        search: searchValue || undefined,
        page: 1,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Update date filters - skip initial mount to prevent infinite loop
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Skip on initial mount to prevent triggering filter change immediately
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only update if dates actually changed
    const newStartDate = startDate?.toISOString();
    const newEndDate = endDate?.toISOString();

    if (
      newStartDate !== filtersRef.current.startDate ||
      newEndDate !== filtersRef.current.endDate
    ) {
      onFiltersChangeRef.current({
        ...filtersRef.current,
        startDate: newStartDate,
        endDate: newEndDate,
        page: 1,
      });
    }
  }, [startDate, endDate]);

  const hasFilters =
    filters.adminId ||
    filters.action ||
    filters.resource ||
    filters.startDate ||
    filters.endDate ||
    searchValue;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-background">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search admin, action, or entity ID..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">Admin:</Label>
        <Select
          value={filters.adminId || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              adminId: value === "all" ? undefined : value,
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Admins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Admins</SelectItem>
            {admins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">Resource:</Label>
        <Select
          value={filters.resource || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              resource: value === "all" ? undefined : value,
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Resources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {RESOURCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">Action:</Label>
        <Select
          value={filters.action || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              action: value === "all" ? undefined : value,
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">Start Date:</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">End Date:</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
