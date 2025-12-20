"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useUpdateInventorySettings } from "@/hooks/inventory/use-update-inventory-settings";
import type { InventorySettings } from "@/lib/types/inventory";
import { VariantThresholdList } from "./variant-threshold-list";

const settingsSchema = z.object({
  globalLowStockThreshold: z
    .number()
    .int()
    .min(0, "Threshold must be at least 0"),
  perVariantOverrides: z.record(z.string(), z.number().int().min(0)).optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface InventorySettingsFormProps {
  settings: InventorySettings;
}

/**
 * Form component for updating inventory settings
 */
export function InventorySettingsForm({
  settings,
}: InventorySettingsFormProps) {
  const updateSettings = useUpdateInventorySettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      globalLowStockThreshold: settings.globalLowStockThreshold,
      perVariantOverrides: settings.perVariantOverrides || {},
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    await updateSettings.mutateAsync(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Settings</CardTitle>
        <CardDescription>
          Configure global and per-variant low stock thresholds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="globalLowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Global Low Stock Threshold</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Default threshold for all variants. Variants below this
                    amount will be marked as low stock.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <VariantThresholdList
              overrides={form.watch("perVariantOverrides") || {}}
              onOverridesChange={(overrides) =>
                form.setValue("perVariantOverrides", overrides)
              }
            />

            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
