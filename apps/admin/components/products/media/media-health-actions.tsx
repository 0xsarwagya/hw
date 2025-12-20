"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMediaHealthFix } from "@/hooks/products/media/use-media-health";

export function MediaHealthActions() {
  const fixMutation = useMediaHealthFix();
  const [fixingAction, setFixingAction] = useState<string | null>(null);

  const handleFix = async (action: string) => {
    setFixingAction(action);
    try {
      await fixMutation.mutateAsync({ action });
    } finally {
      setFixingAction(null);
    }
  };

  const isFixing = fixingAction !== null || fixMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Actions</CardTitle>
        <CardDescription>
          Run automated fixes for media consistency issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => handleFix("order")}
            disabled={isFixing}
            variant="outline"
          >
            {fixingAction === "order" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              "Fix Order Index Errors"
            )}
          </Button>
          <Button
            onClick={() => handleFix("orphans")}
            disabled={isFixing}
            variant="outline"
          >
            {fixingAction === "orphans" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              "Remove Orphan Images"
            )}
          </Button>
          <Button
            onClick={() => handleFix("inheritance")}
            disabled={isFixing}
            variant="outline"
          >
            {fixingAction === "inheritance" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              "Sync Variant Inheritance"
            )}
          </Button>
          <Button
            onClick={() => handleFix("s3")}
            disabled={isFixing}
            variant="outline"
          >
            {fixingAction === "s3" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              "Clean S3 Orphans"
            )}
          </Button>
          <Button
            onClick={() => handleFix("all")}
            disabled={isFixing}
            variant="default"
            className="md:col-span-2"
          >
            {fixingAction === "all" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing All...
              </>
            ) : (
              "Fix All Issues"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
