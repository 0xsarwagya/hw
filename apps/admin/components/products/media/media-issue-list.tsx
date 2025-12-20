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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaHealthScan } from "@/hooks/products/media/use-media-health";

const severityColors = {
  info: "default",
  warning: "secondary",
  error: "destructive",
  critical: "destructive",
} as const;

export function MediaIssueList() {
  const { data, isLoading, error } = useMediaHealthScan();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>Detected media consistency issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>Detected media consistency issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load issues: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const issues = data?.issues || [];

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>Detected media consistency issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No issues detected. Media is healthy!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues</CardTitle>
        <CardDescription>
          Detected media consistency issues ({issues.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Product/Variant</TableHead>
              <TableHead>Suggested Fix</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow
                key={`${issue.type}-${issue.productId || ""}-${issue.variantId || ""}-${issue.imageId || ""}`}
              >
                <TableCell>
                  <Badge variant="outline">{issue.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      severityColors[
                        issue.severity as keyof typeof severityColors
                      ] || "default"
                    }
                  >
                    {issue.severity}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">{issue.description}</TableCell>
                <TableCell>
                  {issue.productId && (
                    <div className="text-xs text-muted-foreground">
                      Product: {issue.productId.slice(0, 8)}...
                    </div>
                  )}
                  {issue.variantId && (
                    <div className="text-xs text-muted-foreground">
                      Variant: {issue.variantId.slice(0, 8)}...
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {issue.suggestedFix || "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
