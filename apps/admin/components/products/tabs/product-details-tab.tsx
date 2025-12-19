"use client";

import dynamic from "next/dynamic";
import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { UpdateProductFormValues } from "@/lib/validations/products";

const PricingEditor = dynamic(
  () =>
    import("@/components/products/pricing-editor").then((mod) => ({
      default: mod.PricingEditor,
    })),
  { loading: () => <div className="h-48 animate-pulse bg-muted rounded" /> },
);

interface ProductDetailsTabProps {
  form: UseFormReturn<UpdateProductFormValues>;
}

/**
 * Details tab component for product editing
 * Contains basic product information and pricing
 */
export function ProductDetailsTab({ form }: ProductDetailsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="product-title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="product-title"
            {...form.register("title")}
            placeholder="Product title"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="product-description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="product-description"
            {...form.register("description")}
            placeholder="Product description"
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="product-status" className="text-sm font-medium">
            Status
          </label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) =>
              form.setValue(
                "status",
                value as "draft" | "active" | "archived" | undefined,
              )
            }
          >
            <SelectTrigger id="product-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <PricingEditor
          price={form.watch("price") || 0}
          gstRate={
            form.watch("gstRate") ? Number(form.watch("gstRate")) : undefined
          }
          pricingType={form.watch("pricingType") || "exclusive"}
          hsnCode={form.watch("hsnCode")}
          onPriceChange={(price) => form.setValue("price", price)}
          onGstRateChange={(rate) =>
            form.setValue(
              "gstRate",
              rate
                ? (rate.toString() as "0" | "5" | "12" | "18" | "28")
                : undefined,
            )
          }
          onPricingTypeChange={(type) => form.setValue("pricingType", type)}
          onHsnCodeChange={(code) => form.setValue("hsnCode", code)}
        />
      </CardContent>
    </Card>
  );
}
