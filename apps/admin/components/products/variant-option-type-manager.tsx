"use client";

import { useAdminAddVariantOptionType } from "@/hooks/products/use-admin-add-variant-option-type";
import { useAdminDeleteVariantOptionType } from "@/hooks/products/use-admin-delete-variant-option-type";
import { useAdminProductVariantOptionTypes } from "@/hooks/products/use-admin-product-variant-option-types";
import { useAdminVariantOptionTypes } from "@/hooks/products/use-admin-variant-option-types";
import { OptionTypeCard } from "./variants/option-type-card";
import { OptionTypeFormDialog } from "./variants/option-type-form-dialog";

interface VariantOptionTypeManagerProps {
  productId: string;
}

/**
 * Main component for managing variant option types
 * Orchestrates option type creation, deletion, and value management
 */
export function VariantOptionTypeManager({
  productId,
}: VariantOptionTypeManagerProps) {
  const { data: optionTypes = [], isLoading } =
    useAdminProductVariantOptionTypes(productId);
  const { data: globalTemplates = [] } = useAdminVariantOptionTypes();
  const addOptionType = useAdminAddVariantOptionType(productId);
  const deleteOptionType = useAdminDeleteVariantOptionType(productId);

  const handleAddOptionType = async (name: string, templateId?: string) => {
    await addOptionType.mutateAsync({
      optionTypeId: templateId,
      name,
    });
  };

  const handleDeleteOptionType = async (optionTypeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this option type? All its values will be deleted.",
      )
    ) {
      return;
    }
    await deleteOptionType.mutateAsync({ optionTypeId });
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading option types...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Variant Option Types</h3>
        <OptionTypeFormDialog
          globalTemplates={globalTemplates}
          onAdd={handleAddOptionType}
          isPending={addOptionType.isPending}
        />
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
