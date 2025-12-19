"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityLogContextViewerProps {
  metadata: Record<string, unknown> | null;
  className?: string;
}

export function ActivityLogContextViewer({
  metadata,
  className,
}: ActivityLogContextViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No metadata available
      </div>
    );
  }

  const jsonString = JSON.stringify(metadata, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Context</span>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7">
          {copied ? (
            <>
              <Check className="mr-2 h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
