"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { QueryState } from "@/components/common/query-state";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { usePaymentCharges } from "@/hooks/payment-charges/use-payment-charges";
import { PaymentFeesForm } from "./payment-fees-form";
import { PaymentFeesList } from "./payment-fees-list";

/**
 * Client component for payment fees page
 */
export function PaymentFeesClient() {
  const { data: charges, isLoading, error } = usePaymentCharges();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isCreating) {
    return (
      <AdminPageLayout
        title="Create Payment Fee"
        description="Configure a new payment method charge"
      >
        <PaymentFeesForm
          onSuccess={() => setIsCreating(false)}
          onCancel={() => setIsCreating(false)}
        />
      </AdminPageLayout>
    );
  }

  if (editingId) {
    return (
      <AdminPageLayout
        title="Edit Payment Fee"
        description="Update payment method charge configuration"
      >
        <PaymentFeesForm
          chargeId={editingId}
          onSuccess={() => setEditingId(null)}
          onCancel={() => setEditingId(null)}
        />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Payment Fees"
      description="Configure charges for different payment methods"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Fee
          </Button>
        </div>
        <QueryState
          isLoading={isLoading}
          error={error}
          data={charges}
          onRetry={() => window.location.reload()}
        >
          {charges && (
            <PaymentFeesList
              charges={charges}
              onEdit={(id) => setEditingId(id)}
            />
          )}
        </QueryState>
      </div>
    </AdminPageLayout>
  );
}
