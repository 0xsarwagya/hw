"use client";

import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { MediaHealthActions } from "@/components/products/media/media-health-actions";
import { MediaHealthPanel } from "@/components/products/media/media-health-panel";
import { MediaIssueList } from "@/components/products/media/media-issue-list";
import { Button } from "@/components/ui/button";
import { useMediaHealthScan } from "@/hooks/products/media/use-media-health";
import { endpoints } from "@/lib/endpoints";

export default function MediaHealthPage() {
  const { refetch, isFetching } = useMediaHealthScan();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: [endpoints.mediaHealth.scan],
    });
    refetch();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Health</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and fix media consistency issues across products and
            variants
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isFetching} variant="outline">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        <MediaHealthPanel />
        <MediaHealthActions />
        <MediaIssueList />
      </div>
    </div>
  );
}
