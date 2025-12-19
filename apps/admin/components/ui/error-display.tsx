"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FetchError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  error: FetchError | Error | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  title,
  onRetry,
  className,
}: ErrorDisplayProps) {
  if (!error) return null;

  const isNetworkError =
    error instanceof Error && "status" in error && error.status === 0;
  const fetchError =
    error instanceof Error && "status" in error ? (error as FetchError) : null;
  const hasFieldErrors =
    fetchError?.errors && Object.keys(fetchError.errors).length > 0;

  return (
    <Card className={cn(isNetworkError && "border-destructive", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-sm">
                {title || (isNetworkError ? "Network Error" : "Error")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || "An unexpected error occurred"}
              </p>
            </div>

            {hasFieldErrors && fetchError.errors && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Field Errors:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {Object.entries(fetchError.errors).map(
                    ([field, messages]) => (
                      <li key={field} className="text-destructive">
                        <span className="font-medium">{field}:</span>{" "}
                        {messages.join(", ")}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-3"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
