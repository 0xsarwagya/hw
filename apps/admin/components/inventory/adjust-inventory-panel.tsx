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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustInventory } from "@/hooks/inventory/use-adjust-inventory";

const adjustInventorySchema = z.object({
  type: z.enum(["increase", "decrease", "set"]),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reason: z.enum([
    "received",
    "correction",
    "damaged",
    "lost",
    "returned",
    "giveaway",
    "manual",
  ]),
  note: z.string().optional(),
});

type AdjustInventoryFormValues = z.infer<typeof adjustInventorySchema>;

interface AdjustInventoryPanelProps {
  variantId: string;
}

/**
 * Panel component for adjusting inventory for a single variant
 */
export function AdjustInventoryPanel({ variantId }: AdjustInventoryPanelProps) {
  const adjustInventory = useAdjustInventory(variantId);

  const form = useForm<AdjustInventoryFormValues>({
    resolver: zodResolver(adjustInventorySchema),
    defaultValues: {
      type: "increase",
      quantity: 1,
      reason: "manual",
      note: "",
    },
  });

  const onSubmit = async (data: AdjustInventoryFormValues) => {
    await adjustInventory.mutateAsync(data);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adjust Inventory</CardTitle>
        <CardDescription>
          Make manual adjustments to inventory levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="increase">Increase</SelectItem>
                      <SelectItem value="decrease">Decrease</SelectItem>
                      <SelectItem value="set">Set Exact Quantity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
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
                    Amount to adjust (positive number)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="correction">Correction</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="giveaway">Giveaway</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a note about this adjustment..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={adjustInventory.isPending}
              className="w-full"
            >
              {adjustInventory.isPending ? "Adjusting..." : "Adjust Inventory"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
