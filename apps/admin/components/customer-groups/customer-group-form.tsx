"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateCustomerGroupInput,
  UpdateCustomerGroupInput,
} from "@/lib/types/customer-groups";

const customerGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type CustomerGroupFormValues = z.infer<typeof customerGroupSchema>;

interface CustomerGroupFormProps {
  initialData?: CreateCustomerGroupInput | UpdateCustomerGroupInput;
  onSubmit: (data: CreateCustomerGroupInput | UpdateCustomerGroupInput) => void;
  isLoading?: boolean;
}

export function CustomerGroupForm({
  initialData,
  onSubmit,
  isLoading = false,
}: CustomerGroupFormProps) {
  const form = useForm<CustomerGroupFormValues>({
    resolver: zodResolver(customerGroupSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleSubmit = (values: CustomerGroupFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description || undefined,
      isActive: values.isActive,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="B2B Corporate" {...field} />
              </FormControl>
              <FormDescription>
                A unique name for this customer group
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Corporate customers with special pricing"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Optional description for this customer group
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  Inactive groups won't be applied to customers
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
