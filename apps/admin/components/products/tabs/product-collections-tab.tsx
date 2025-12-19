"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Collection } from "@/lib/types/collections";

interface ProductCollectionsTabProps {
  allCollections: Collection[];
  selectedCollectionIds: Set<string>;
  onCollectionToggle: (collectionId: string, checked: boolean) => void;
}

/**
 * Collections tab component for product editing
 * Manages product collection assignments
 */
export function ProductCollectionsTab({
  allCollections,
  selectedCollectionIds,
  onCollectionToggle,
}: ProductCollectionsTabProps) {
  if (allCollections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Collections</CardTitle>
              <CardDescription>
                Assign this product to collections
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/products/collections/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No collections available</p>
            <Button asChild variant="outline">
              <Link href="/products/collections/create">Create Collection</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Collections</CardTitle>
            <CardDescription>
              Assign this product to collections
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/products/collections/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {allCollections.map((collection) => {
              const isSelected = selectedCollectionIds.has(collection.id);
              return (
                <div
                  key={collection.id}
                  className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent"
                >
                  <Checkbox
                    id={`collection-${collection.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      onCollectionToggle(collection.id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`collection-${collection.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{collection.name}</span>
                      {collection.productCount !== undefined && (
                        <span className="text-sm text-muted-foreground">
                          {collection.productCount} products
                        </span>
                      )}
                    </div>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {collection.description}
                      </p>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
