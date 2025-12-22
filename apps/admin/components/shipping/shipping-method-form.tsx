"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  CreateShippingMethodInput,
  ShippingMethod,
  UpdateShippingMethodInput,
} from "@/lib/types/shipping-methods";
import {
  createShippingMethodSchema,
  updateShippingMethodSchema,
} from "@/lib/validations/shipping-methods";

interface ShippingMethodFormProps {
  method?: ShippingMethod;
  onSubmit: (
    data: CreateShippingMethodInput | UpdateShippingMethodInput,
  ) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ShippingMethodForm({
  method,
  onSubmit,
  onCancel,
  isLoading = false,
}: ShippingMethodFormProps) {
  const form = useForm<CreateShippingMethodInput | UpdateShippingMethodInput>({
    resolver: zodResolver(
      method ? updateShippingMethodSchema : createShippingMethodSchema,
    ),
    defaultValues: method
      ? {
          name: method.name,
          description: method.description || undefined,
          code: method.code,
          baseRate: method.baseRate,
          estimatedDays: method.estimatedDays,
          codAvailable: method.codAvailable,
          codCharge: method.codCharge || undefined,
          isActive: method.isActive,
          priority: method.priority,
          minOrderValue: method.minOrderValue || undefined,
          maxOrderValue: method.maxOrderValue || undefined,
          restrictedZones: method.restrictedZones || undefined,
          restrictedStates: method.restrictedStates || undefined,
        }
      : {
          name: "",
          description: "",
          code: "",
          baseRate: 0,
          estimatedDays: 5,
          codAvailable: true,
          codCharge: undefined,
          isActive: true,
          priority: 0,
          minOrderValue: undefined,
          maxOrderValue: undefined,
          restrictedZones: undefined,
          restrictedStates: undefined,
        },
  });

  const handleSubmit = async (
    data: CreateShippingMethodInput | UpdateShippingMethodInput,
  ) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Standard Shipping" {...field} />
                </FormControl>
                <FormDescription>
                  Display name shown to customers during checkout
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code *</FormLabel>
                <FormControl>
                  <Input placeholder="standard" {...field} />
                </FormControl>
                <FormDescription>
                  Unique internal code (lowercase, alphanumeric,
                  hyphens/underscores)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Standard delivery within 5-7 business days"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Description shown to customers during checkout
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="baseRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Rate (in paise) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="5000"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormDescription>
                  Base shipping cost in paise (e.g., 5000 = ₹50.00)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Delivery Days *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="5"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 1)
                    }
                  />
                </FormControl>
                <FormDescription>
                  Estimated delivery time in days
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="codCharge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>COD Charge (in paise)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="3000"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Additional charge for COD orders (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    placeholder="0"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormDescription>
                  Higher priority methods are shown first (default: 0)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="minOrderValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Order Value (in paise)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="100000"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Minimum order value required for this method (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxOrderValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Order Value (in paise)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="10000000"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Maximum order value allowed for this method (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="codAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>COD Available</FormLabel>
                  <FormDescription>
                    Allow Cash on Delivery for this shipping method
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>
                    Show this method to customers during checkout
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : method
                ? "Update Shipping Method"
                : "Create Shipping Method"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
