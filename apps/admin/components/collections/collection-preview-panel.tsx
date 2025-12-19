"use client";

import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminCollectionPreview } from "@/hooks/collections/use-admin-collection-preview";
import type { CollectionRule } from "@/lib/types/collections";

interface CollectionPreviewPanelProps {
  collectionId?: string;
  rules: CollectionRule[];
  matchType: "all" | "any";
  enabled?: boolean;
}

export function CollectionPreviewPanel({
  collectionId,
  rules,
  matchType,
  enabled = true,
}: CollectionPreviewPanelProps) {
  const { data, isLoading, error } = useAdminCollectionPreview(
    collectionId || "",
    enabled && !!collectionId && rules.length > 0,
  );

  if (!enabled || !collectionId || rules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            {rules.length === 0
              ? "Add rules to see preview"
              : "Save collection to see preview"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          Products matching {matchType === "all" ? "all" : "any"} rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Calculating matches...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">
            Error loading preview: {error.message}
          </div>
        ) : (
          <div className="text-2xl font-bold">
            {data?.count ?? 0}{" "}
            <span className="text-base font-normal text-muted-foreground">
              products
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
