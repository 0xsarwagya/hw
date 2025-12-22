"use client";

import { useAdminUpdateBundleSet } from "@/hooks/bundles/use-admin-update-bundle-set";
import type { BundleSet, CreateBundleSetInput } from "@/lib/types/bundles";
import { BundleSetForm } from "./bundle-set-form";

interface BundleSetEditorProps {
  bundleId: string;
  bundleSet: BundleSet;
  onCancel: () => void;
  onSuccess: () => void;
}

export function BundleSetEditor({
  bundleId,
  bundleSet,
  onCancel,
  onSuccess,
}: BundleSetEditorProps) {
  const updateSet = useAdminUpdateBundleSet(bundleId, bundleSet.id);

  const handleSubmit = async (data: CreateBundleSetInput) => {
    await updateSet.mutateAsync(data);
    onSuccess();
  };

  return (
    <BundleSetForm
      initialData={{
        title: bundleSet.title,
        description: bundleSet.description,
        minQuantity: bundleSet.minQuantity,
        maxQuantity: bundleSet.maxQuantity,
      }}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={updateSet.isPending}
      submitLabel="Update Set"
    />
  );
}
