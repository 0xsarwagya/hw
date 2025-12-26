"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit,
  Package,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdminBundle } from "@/hooks/bundles/use-admin-bundle";
import { useAdminCreateBundleSet } from "@/hooks/bundles/use-admin-create-bundle-set";
import { useAdminDeleteBundleSet } from "@/hooks/bundles/use-admin-delete-bundle-set";
import type { CreateBundleSetInput } from "@/lib/types/bundles";
import { BundleSetEditor } from "./bundle-set-editor";
import { BundleSetForm } from "./bundle-set-form";
import { EnhancedBundleSetItemsList } from "./enhanced-bundle-set-items-list";

interface BundleSetsManagerProps {
  bundleId: string;
}

export function BundleSetsManager({ bundleId }: BundleSetsManagerProps) {
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [expandedSetIds, setExpandedSetIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<string | null>(null);

  const { data: bundle, refetch } = useAdminBundle(bundleId);
  const createSet = useAdminCreateBundleSet(bundleId);
  const deleteSet = useAdminDeleteBundleSet(bundleId);

  const sets = bundle?.sets || [];

  const toggleSetExpanded = (setId: string) => {
    setExpandedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  };

  const handleCreateSet = async (data: CreateBundleSetInput) => {
    await createSet.mutateAsync(data);
    refetch();
  };

  const handleDeleteSet = async () => {
    if (setToDelete) {
      await deleteSet.mutateAsync(setToDelete);
      setDeleteDialogOpen(false);
      setSetToDelete(null);
      refetch();
    }
  };

  const handleStartDelete = (setId: string) => {
    setSetToDelete(setId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Choice Sets</h3>
          <p className="text-sm text-muted-foreground">
            Create sets that customers can choose from. Each set can have
            multiple product variants.
          </p>
        </div>
        <Badge variant="secondary">{sets.length} sets</Badge>
      </div>

      {sets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                No choice sets created yet. Create your first set to get
                started.
              </p>
              <BundleSetForm
                onSubmit={handleCreateSet}
                isLoading={createSet.isPending}
                submitLabel="Create Set"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sets.map((set, index) => {
            const isExpanded = expandedSetIds.has(set.id);
            const isEditing = editingSetId === set.id;
            const variantCount = set.items?.length || 0;
            const isComplete = variantCount > 0;
            const isRequired = set.minQuantity > 0;

            return (
              <Card
                key={set.id}
                className={
                  !isComplete
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-green-500/20 bg-green-50/50 dark:bg-green-950/20"
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                            {index + 1}
                          </div>
                          <CardTitle className="text-base">
                            {set.title}
                          </CardTitle>
                        </div>
                        {isComplete ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {variantCount} variant
                            {variantCount !== 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Empty
                          </Badge>
                        )}
                        <Badge variant="outline">
                          <Package className="mr-1 h-3 w-3" />
                          {set.minQuantity === set.maxQuantity
                            ? `Select ${set.minQuantity}`
                            : `Select ${set.minQuantity}-${set.maxQuantity}`}
                        </Badge>
                        {isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      {set.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {set.description}
                        </p>
                      )}
                      {!isComplete && (
                        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          This set needs at least one variant to be usable.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSetExpanded(set.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {!isEditing && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSetId(set.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartDelete(set.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <BundleSetEditor
                      bundleId={bundleId}
                      bundleSet={set}
                      onCancel={() => setEditingSetId(null)}
                      onSuccess={() => {
                        setEditingSetId(null);
                        refetch();
                      }}
                    />
                  ) : (
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={(open) => {
                        if (open) {
                          setExpandedSetIds((prev) =>
                            new Set(prev).add(set.id),
                          );
                        } else {
                          setExpandedSetIds((prev) => {
                            const next = new Set(prev);
                            next.delete(set.id);
                            return next;
                          });
                        }
                      }}
                    >
                      <CollapsibleContent>
                        <EnhancedBundleSetItemsList
                          bundleId={bundleId}
                          bundleSet={set}
                          onItemsChange={refetch}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-dashed">
            <CardContent className="pt-6">
              <BundleSetForm
                onSubmit={handleCreateSet}
                isLoading={createSet.isPending}
                submitLabel="Add Set"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Choice Set"
        description="Are you sure you want to delete this choice set? This will also remove all items in the set. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteSet}
        isLoading={deleteSet.isPending}
      />
    </div>
  );
}
