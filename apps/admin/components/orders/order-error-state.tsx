"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import type { FetchError } from "@/lib/api";

interface OrderErrorStateProps {
  error: FetchError | null;
}

/**
 * Error state component for order detail page
 * Displays error message and provides navigation back to orders list
 */
export function OrderErrorState({ error }: OrderErrorStateProps) {
  const router = useRouter();
  const errorMessage = error?.message || "Order not found";

  return (
    <AdminPageLayout title="Order Not Found">
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{errorMessage}</p>
        <Button onClick={() => router.push("/orders")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    </AdminPageLayout>
  );
}
