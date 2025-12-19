"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Money } from "@/components/orders/money";
import { ImageManager } from "@/components/products/image-manager";
import { InventoryEditor } from "@/components/products/inventory-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminInventoryAdjust } from "@/hooks/products/use-admin-inventory-adjust";
import { useAdminProductImages } from "@/hooks/products/use-admin-product-images";
import { useAdminUpdateVariant } from "@/hooks/products/use-admin-update-variant";
import type { Variant } from "@/lib/types/products";
import type {
  UpdateVariantFormValues,
  UpdateVariantInput,
} from "@/lib/validations/products";
import {
  updateVariantFormSchema,
  updateVariantSchema,
} from "@/lib/validations/products";

interface EditVariantFormProps {
  productId: string;
  variant: Variant;
}

export function EditVariantForm({ productId, variant }: EditVariantFormProps) {
  const _router = useRouter();
  const { data: variantImages } = useAdminProductImages(productId);
  const updateVariant = useAdminUpdateVariant(productId, variant.id);
  const adjustInventory = useAdminInventoryAdjust(productId, variant.id);

  const variantSpecificImages =
    variantImages?.filter((img) => img.variantId === variant.id) || [];

  const form = useForm<UpdateVariantFormValues>({
    resolver: zodResolver(updateVariantFormSchema),
    values: {
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice || undefined,
      currency: variant.currency,
      salePrice: variant.salePrice || undefined,
      saleStartDate: variant.saleStartDate?.toISOString(),
      saleEndDate: variant.saleEndDate?.toISOString(),
      inventory: variant.inventory,
      size: variant.size || undefined,
      color: variant.color || undefined,
      weight: variant.weight || undefined,
    },
  });

  const onSubmit = async (data: UpdateVariantFormValues) => {
    const apiData: UpdateVariantInput = updateVariantSchema.parse(data);
    await updateVariant.mutateAsync(apiData);
  };

  const _getVariantName = () => {
    const parts: string[] = [];
    if (variant.size) parts.push(variant.size);
    if (variant.color) parts.push(variant.color);
    return parts.length > 0 ? parts.join(" / ") : "Default Variant";
  };

  const getSaleStatus = () => {
    if (!variant.salePrice || !variant.saleStartDate || !variant.saleEndDate) {
      return null;
    }
    const now = new Date();
    const start = new Date(variant.saleStartDate);
    const end = new Date(variant.saleEndDate);

    if (now < start) return "scheduled";
    if (now >= start && now <= end) return "active";
    return "expired";
  };

  const saleStatus = getSaleStatus();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Variant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...form.register("sku")} placeholder="SKU" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      {...form.register("size")}
                      placeholder="Size"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      {...form.register("color")}
                      placeholder="Color"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    {...form.register("weight", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Variant Images</CardTitle>
                <CardDescription>
                  Upload variant-specific images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageManager
                  productId={productId}
                  images={variantSpecificImages}
                  variantId={variant.id}
                  onImagesChange={() => {}}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Variant images are optional. You can add them later if needed.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price (INR)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...form.register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare-at Price (INR)</Label>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    {...form.register("compareAtPrice", {
                      valueAsNumber: true,
                    })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price (INR)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    {...form.register("salePrice", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="saleStartDate">Sale Start Date</Label>
                    <Input
                      id="saleStartDate"
                      type="datetime-local"
                      {...form.register("saleStartDate")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saleEndDate">Sale End Date</Label>
                    <Input
                      id="saleEndDate"
                      type="datetime-local"
                      {...form.register("saleEndDate")}
                    />
                  </div>
                </div>

                {saleStatus && (
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm font-medium mb-1">Sale Status</div>
                    <div className="text-sm text-muted-foreground">
                      {saleStatus === "active" && "Sale is currently active"}
                      {saleStatus === "scheduled" &&
                        "Sale is scheduled for the future"}
                      {saleStatus === "expired" && "Sale has expired"}
                    </div>
                    {variant.saleStartDate && variant.saleEndDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(variant.saleStartDate), "MMM d, yyyy")}{" "}
                        - {format(new Date(variant.saleEndDate), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">SKU</div>
              <div className="font-medium font-mono text-sm">{variant.sku}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Price</div>
              <div className="font-medium">
                <Money amount={variant.salePrice || variant.price} />
                {variant.compareAtPrice &&
                  variant.compareAtPrice > variant.price && (
                    <div className="text-xs text-muted-foreground line-through">
                      <Money amount={variant.compareAtPrice} />
                    </div>
                  )}
              </div>
            </div>

            {variant.size && (
              <div>
                <div className="text-sm text-muted-foreground">Size</div>
                <div className="font-medium">{variant.size}</div>
              </div>
            )}

            {variant.color && (
              <div>
                <div className="text-sm text-muted-foreground">Color</div>
                <div className="font-medium">{variant.color}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <InventoryEditor
          currentQuantity={variant.inventory}
          reservedQuantity={0}
          onAdjust={async (quantity) => {
            await adjustInventory.mutateAsync({ quantity });
          }}
          onSetExact={async (quantity) => {
            await updateVariant.mutateAsync({ inventory: quantity });
          }}
          onMarkOutOfStock={async () => {
            await updateVariant.mutateAsync({ inventory: 0 });
          }}
          isLoading={adjustInventory.isPending || updateVariant.isPending}
        />
      </div>

      <div className="lg:col-span-3 flex gap-2 justify-end">
        <Button variant="outline" asChild>
          <Link href={`/products/${productId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={updateVariant.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
