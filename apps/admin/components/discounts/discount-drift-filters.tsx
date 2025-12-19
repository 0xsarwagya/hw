"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import type { DriftSeverity } from "@/lib/types/discounts";
import { cn } from "@/lib/utils";

interface DiscountDriftFiltersProps {
  dateFrom?: Date | null;
  dateTo?: Date | null;
  severity?: DriftSeverity;
  cartId?: string;
  orderId?: string;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onSeverityChange: (severity: DriftSeverity | undefined) => void;
  onCartIdChange: (cartId: string) => void;
  onOrderIdChange: (orderId: string) => void;
  onClear: () => void;
}

export function DiscountDriftFilters({
  dateFrom,
  dateTo,
  severity,
  cartId,
  orderId,
  onDateFromChange,
  onDateToChange,
  onSeverityChange,
  onCartIdChange,
  onOrderIdChange,
  onClear,
}: DiscountDriftFiltersProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <Label>Filters</Label>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Date From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom || undefined}
                onSelect={onDateFromChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Date To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo || undefined}
                onSelect={onDateToChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Severity</Label>
          <Select
            value={severity || ""}
            onValueChange={(v) =>
              onSeverityChange(v ? (v as DriftSeverity) : undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cart ID</Label>
          <Input
            value={cartId || ""}
            onChange={(e) => onCartIdChange(e.target.value)}
            placeholder="Filter by cart ID"
          />
        </div>

        <div className="space-y-2">
          <Label>Order ID</Label>
          <Input
            value={orderId || ""}
            onChange={(e) => onOrderIdChange(e.target.value)}
            placeholder="Filter by order ID"
          />
        </div>
      </div>
    </div>
  );
}
