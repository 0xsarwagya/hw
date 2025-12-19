"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VariantOptionValue } from "@/lib/types/products";

interface OptionValueListProps {
  values: VariantOptionValue[];
  onAdd: (value: string) => Promise<void>;
  onDelete: (valueId: string) => Promise<void>;
  isAddingPending?: boolean;
}

/**
 * Component for managing option values within an option type
 */
export function OptionValueList({
  values,
  onAdd,
  onDelete,
  isAddingPending = false,
}: OptionValueListProps) {
  const [newValue, setNewValue] = useState("");
  const [isAddingValue, setIsAddingValue] = useState(false);

  const handleAddValue = async () => {
    if (!newValue.trim()) return;

    try {
      await onAdd(newValue.trim());
      setNewValue("");
      setIsAddingValue(false);
    } catch (_error) {
      // Error handled by parent
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Values</Label>
        {!isAddingValue ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingValue(true)}
          >
            <Plus className="mr-2 h-3 w-3" />
            Add Value
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="e.g., XS, S, M, L, XL"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddValue();
                } else if (e.key === "Escape") {
                  setIsAddingValue(false);
                  setNewValue("");
                }
              }}
              className="h-8"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsAddingValue(false);
                setNewValue("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddValue}
              disabled={!newValue.trim() || isAddingPending}
            >
              Add
            </Button>
          </div>
        )}
      </div>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <div
              key={value.id}
              className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
            >
              <span>{value.value}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this value?")) {
                    onDelete(value.id);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No values added yet. Click "Add Value" to add one.
        </p>
      )}
    </div>
  );
}
