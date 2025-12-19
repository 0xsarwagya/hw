"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VariantOptionType as VariantOptionTypeTemplate } from "@/lib/types/products";

interface OptionTypeFormDialogProps {
  globalTemplates: VariantOptionTypeTemplate[];
  onAdd: (name: string, templateId?: string) => Promise<void>;
  isPending?: boolean;
}

/**
 * Dialog component for adding a new variant option type
 */
export function OptionTypeFormDialog({
  globalTemplates,
  onAdd,
  isPending = false,
}: OptionTypeFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newOptionTypeName, setNewOptionTypeName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >();

  const handleAdd = async () => {
    if (!newOptionTypeName.trim()) return;

    try {
      await onAdd(newOptionTypeName.trim(), selectedTemplateId);
      setNewOptionTypeName("");
      setSelectedTemplateId(undefined);
      setIsOpen(false);
    } catch (_error) {
      // Error handled by parent
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Option Type
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Variant Option Type</DialogTitle>
          <DialogDescription>
            Create a new option type or use an existing template
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Use Template (Optional)</Label>
            <Select
              value={selectedTemplateId || "none"}
              onValueChange={(value) =>
                setSelectedTemplateId(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Create Custom</SelectItem>
                {globalTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="option-type-name">Option Type Name *</Label>
            <Input
              id="option-type-name"
              placeholder="e.g., Size, Color, Fabric"
              value={newOptionTypeName}
              onChange={(e) => setNewOptionTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setNewOptionTypeName("");
                setSelectedTemplateId(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!newOptionTypeName.trim() || isPending}
            >
              {isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
