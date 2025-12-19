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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminCategoryTree } from "@/hooks/categories/use-admin-categories";
import { FIELD_LABELS, PLACEHOLDERS } from "@/lib/constants/forms.constants";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/types/categories";

interface CategoryBasicFieldsProps {
  form: UseFormReturn<CreateCategoryInput | UpdateCategoryInput>;
  category?: Category;
}

/**
 * Component for category basic information fields
 */
export function CategoryBasicFields({
  form,
  category,
}: CategoryBasicFieldsProps) {
  const { data: categoryTree = [] } = useAdminCategoryTree();

  const getAvailableParents = () => {
    const flatten = (cats: Category[], excludeId?: string): Category[] => {
      const result: Category[] = [];
      for (const cat of cats) {
        if (cat.id !== excludeId) {
          result.push(cat);
          if (cat.children && cat.children.length > 0) {
            result.push(...flatten(cat.children, excludeId));
          }
        }
      }
      return result;
    };
    return flatten(categoryTree, category?.id);
  };

  return (
    <FormSection
      title="Category Information"
      description="Basic category details"
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{FIELD_LABELS.CATEGORY_NAME} *</FormLabel>
            <FormControl>
              <Input placeholder={PLACEHOLDERS.CATEGORY_NAME} {...field} />
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
              <Input placeholder="category-slug" {...field} />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate from name
            </p>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="parentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Parent Category</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value === "none" ? undefined : value)
              }
              value={field.value || "none"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="No parent (top-level category)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">
                  No parent (top-level category)
                </SelectItem>
                {getAvailableParents().map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
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
                placeholder={PLACEHOLDERS.CATEGORY_DESCRIPTION}
                {...field}
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="position"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Position</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="0"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value, 10),
                  )
                }
              />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first. Default is 0.
            </p>
          </FormItem>
        )}
      />
    </FormSection>
  );
}
