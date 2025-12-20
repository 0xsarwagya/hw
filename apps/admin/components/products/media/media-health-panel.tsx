"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaHealthScan } from "@/hooks/products/media/use-media-health";

export function MediaHealthPanel() {
  const { data, isLoading, error } = useMediaHealthScan();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Media Health</CardTitle>
          <CardDescription>Current media consistency status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Media Health</CardTitle>
          <CardDescription>Current media consistency status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load media health data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Health</CardTitle>
        <CardDescription>Current media consistency status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Products</div>
            <div className="text-2xl font-bold">
              {stats?.totalProducts || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Images</div>
            <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Product Images</div>
            <div className="text-2xl font-bold">
              {stats?.productImages || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Variant Images</div>
            <div className="text-2xl font-bold">
              {stats?.variantImages || 0}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Orphan Images</span>
            <Badge variant={stats?.orphanImages ? "destructive" : "default"}>
              {stats?.orphanImages || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Order Index Issues</span>
            <Badge
              variant={stats?.orderIndexIssues ? "destructive" : "default"}
            >
              {stats?.orderIndexIssues || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">S3 Consistency Issues</span>
            <Badge
              variant={stats?.s3ConsistencyIssues ? "destructive" : "default"}
            >
              {stats?.s3ConsistencyIssues || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Variant Inheritance Issues</span>
            <Badge
              variant={
                stats?.variantInheritanceIssues ? "destructive" : "default"
              }
            >
              {stats?.variantInheritanceIssues || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">Total Issues</span>
            <Badge variant={stats?.totalIssues ? "destructive" : "default"}>
              {stats?.totalIssues || 0}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
