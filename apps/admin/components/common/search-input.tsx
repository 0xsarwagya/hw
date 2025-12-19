"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "full";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "w-full",
};

/**
 * Reusable search input component with icon
 * Provides consistent search input styling across the application
 */
export function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className,
  maxWidth = "sm",
}: SearchInputProps) {
  return (
    <div className={cn("relative flex-1", maxWidthClasses[maxWidth], className)}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}

