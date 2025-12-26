"use client";

import { ExternalLink, Package } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductBundles } from "@/hooks/bundles/use-product-bundles";

interface ProductBundlesTabProps {
  productId: string;
}

/**
 * Tab component showing all bundles that contain this product's variants
 */
export function ProductBundlesTab({ productId }: ProductBundlesTabProps) {
  const { data: bundles, isLoading } = useProductBundles(productId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
            <div className="h-32 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bundles || bundles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bundles</CardTitle>
          <CardDescription>
            Bundles containing this product's variants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              This product is not included in any bundles yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundles</CardTitle>
        <CardDescription>
          Bundles containing this product's variants ({bundles.length}{" "}
          {bundles.length === 1 ? "bundle" : "bundles"})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sets</TableHead>
                <TableHead>Variants Used</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bundle.title}</div>
                      {bundle.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {bundle.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={bundle.isActive ? "default" : "secondary"}>
                      {bundle.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {bundle.allowMixAndMatch && (
                      <Badge variant="outline" className="ml-2">
                        Mix & Match
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {bundle.relevantSets.map(({ set, itemCount }) => (
                        <div key={set.id} className="text-sm">
                          <span className="font-medium">{set.title}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {itemCount} variant{itemCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {bundle.relevantSets.reduce(
                        (sum, { itemCount }) => sum + itemCount,
                        0,
                      )}{" "}
                      variant
                      {bundle.relevantSets.reduce(
                        (sum, { itemCount }) => sum + itemCount,
                        0,
                      ) !== 1
                        ? "s"
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      asChild
                      title="View Bundle"
                    >
                      <Link href={`/bundles/${bundle.id}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
