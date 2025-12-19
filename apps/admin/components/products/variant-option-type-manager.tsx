"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { useAdminVariantOptionTypes } from "@/hooks/products/use-admin-variant-option-types";
import { useAdminAddVariantOptionType } from "@/hooks/products/use-admin-add-variant-option-type";
import { useAdminDeleteVariantOptionType } from "@/hooks/products/use-admin-delete-variant-option-type";
import { useAdminAddVariantOptionValue } from "@/hooks/products/use-admin-add-variant-option-value";
import { useAdminDeleteVariantOptionValue } from "@/hooks/products/use-admin-delete-variant-option-value";
import { useAdminProductVariantOptionTypes } from "@/hooks/products/use-admin-product-variant-option-types";
import type { ProductVariantOptionType, VariantOptionValue } from "@/lib/types/products";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface VariantOptionTypeManagerProps {
  productId: string;
}

export function VariantOptionTypeManager({ productId }: VariantOptionTypeManagerProps) {
  const { data: optionTypes = [], isLoading } = useAdminProductVariantOptionTypes(productId);
  const { data: globalTemplates = [] } = useAdminVariantOptionTypes();
  const addOptionType = useAdminAddVariantOptionType(productId);
  const deleteOptionType = useAdminDeleteVariantOptionType(productId);
  const [newOptionTypeName, setNewOptionTypeName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [isAddingOptionType, setIsAddingOptionType] = useState(false);

  const handleAddOptionType = async () => {
    if (!newOptionTypeName.trim()) return;

    try {
      await addOptionType.mutateAsync({
        optionTypeId: selectedTemplateId,
        name: newOptionTypeName.trim(),
      });
      setNewOptionTypeName("");
      setSelectedTemplateId(undefined);
      setIsAddingOptionType(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteOptionType = async (optionTypeId: string) => {
    if (!confirm("Are you sure you want to delete this option type? All its values will be deleted.")) {
      return;
    }
    await deleteOptionType.mutateAsync({ optionTypeId });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading option types...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Variant Option Types</h3>
        <Dialog open={isAddingOptionType} onOpenChange={setIsAddingOptionType}>
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
                      handleAddOptionType();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingOptionType(false);
                    setNewOptionTypeName("");
                    setSelectedTemplateId(undefined);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddOptionType}
                  disabled={!newOptionTypeName.trim() || addOptionType.isPending}
                >
                  {addOptionType.isPending ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {optionTypes.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            No variant option types defined. Add one to start creating variants.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {optionTypes.map((optionType) => (
            <OptionTypeCard
              key={optionType.id}
              productId={productId}
              optionType={optionType}
              onDelete={() => handleDeleteOptionType(optionType.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OptionTypeCardProps {
  productId: string;
  optionType: ProductVariantOptionType;
  onDelete: () => void;
}

function OptionTypeCard({ productId, optionType, onDelete }: OptionTypeCardProps) {
  const addValue = useAdminAddVariantOptionValue(productId, optionType.id);
  const deleteValue = useAdminDeleteVariantOptionValue(productId, optionType.id);
  const [newValue, setNewValue] = useState("");
  const [isAddingValue, setIsAddingValue] = useState(false);

  const handleAddValue = async () => {
    if (!newValue.trim()) return;

    try {
      await addValue.mutateAsync({
        value: newValue.trim(),
      });
      setNewValue("");
      setIsAddingValue(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteValue = async (valueId: string) => {
    if (!confirm("Are you sure you want to delete this value?")) {
      return;
    }
    await deleteValue.mutateAsync({ valueId });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{optionType.name}</CardTitle>
            {optionType.optionTypeId && (
              <CardDescription className="text-xs mt-1">
                Using template
              </CardDescription>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  disabled={!newValue.trim() || addValue.isPending}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {optionType.values && optionType.values.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {optionType.values.map((value) => (
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
                    onClick={() => handleDeleteValue(value.id)}
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
      </CardContent>
    </Card>
  );
}

