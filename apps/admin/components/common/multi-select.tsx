"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface MultiSelectOption {
  id: string;
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
  className?: string;
}

/**
 * Multi-select component with checkboxes
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  maxDisplay = 3,
  className,
}: MultiSelectProps) {
  const [isOpen, _setIsOpen] = useState(false);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.value));
  const displayed = selectedOptions.slice(0, maxDisplay);
  const remaining = selectedOptions.length - maxDisplay;

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
        {displayed.map((option) => (
          <Badge key={option.id} variant="secondary" className="gap-1">
            {option.label}
            <button
              type="button"
              onClick={() => handleRemove(option.value)}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {remaining > 0 && <Badge variant="secondary">+{remaining} more</Badge>}
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
          {options.map((option) => {
            const checkboxId = `multi-select-${option.id}`;
            return (
              <label
                key={option.id}
                htmlFor={checkboxId}
                className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  id={checkboxId}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => handleToggle(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
