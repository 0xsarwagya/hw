"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormSection } from "@/components/common/form-section";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_LABELS, PLACEHOLDERS } from "@/lib/constants/forms.constants";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/types/collections";

interface CollectionBasicFieldsProps {
  form: UseFormReturn<CreateCollectionInput | UpdateCollectionInput>;
}

/**
 * Component for collection basic information fields
 */
export function CollectionBasicFields({ form }: CollectionBasicFieldsProps) {
  return (
    <FormSection
      title="Collection Information"
      description="Basic details about the collection"
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{FIELD_LABELS.COLLECTION_NAME}</FormLabel>
            <FormControl>
              <Input placeholder={PLACEHOLDERS.COLLECTION_NAME} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slug</FormLabel>
            <FormControl>
              <Input placeholder="summer-sale" {...field} />
            </FormControl>
            <FormMessage />
            <p className="text-sm text-muted-foreground">
              URL-friendly identifier (auto-generated from name if not provided)
            </p>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{FIELD_LABELS.DESCRIPTION}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={PLACEHOLDERS.COLLECTION_DESCRIPTION}
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
