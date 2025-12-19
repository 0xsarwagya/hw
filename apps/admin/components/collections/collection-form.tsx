"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/types/collections";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/validations/collections";
import { CollectionBasicFields } from "./collection-basic-fields";
import { CollectionImageUpload } from "./collection-image-upload";

interface CollectionFormProps {
  collection?: Collection;
  onSubmit: (
    data: CreateCollectionInput | UpdateCollectionInput,
  ) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CollectionForm({
  collection,
  onSubmit,
  onCancel,
  isLoading = false,
}: CollectionFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    collection?.imageUrl || null,
  );
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CreateCollectionInput | UpdateCollectionInput>({
    resolver: zodResolver(
      collection ? updateCollectionSchema : createCollectionSchema,
    ),
    defaultValues: collection
      ? {
          name: collection.name,
          slug: collection.slug,
          description: collection.description || undefined,
          imageUrl: collection.imageUrl || undefined,
        }
      : {
          name: "",
          slug: "",
          description: "",
          imageUrl: undefined,
        },
  });

  const handleSubmit = async (
    data: CreateCollectionInput | UpdateCollectionInput,
  ) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <CollectionBasicFields form={form} />

        <CollectionImageUpload
          form={form}
          imageUrl={imageUrl}
          isUploading={isUploading}
          onImageChange={setImageUrl}
          onUploadingChange={setIsUploading}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isUploading}>
            {isLoading
              ? "Saving..."
              : collection
                ? "Update Collection"
                : "Create Collection"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
