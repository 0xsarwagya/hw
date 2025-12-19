"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { toast } from "sonner";
import { AbandonedCheckoutDetail } from "@/components/abandoned-checkouts/abandoned-checkout-detail";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { OrderDetailSkeleton } from "@/components/skeletons/order-detail-skeleton";
import { Button } from "@/components/ui/button";
import { useAbandonedCheckout } from "@/hooks/abandoned-checkouts/use-abandoned-checkout";

interface AbandonedCheckoutDetailPageProps {
  params: Promise<{ cartId: string }>;
}

export default function AbandonedCheckoutDetailPage({
  params,
}: AbandonedCheckoutDetailPageProps) {
  const { cartId } = use(params);
  const router = useRouter();
  const { data: checkout, isLoading, error } = useAbandonedCheckout(cartId);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !checkout) {
    if (error) {
      toast.error(error.message || "Failed to load abandoned checkout");
    }
    return (
      <AdminPageLayout title="Checkout Not Found">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            {error?.message || "Checkout not found"}
          </p>
          <Button
            onClick={() => router.push("/orders/abandoned")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Abandoned Checkouts
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={`Abandoned Checkout`}
      breadcrumbs={[
        { label: "Orders", href: "/orders" },
        { label: "Abandoned Checkouts", href: "/orders/abandoned" },
        { label: checkout.cartId.slice(0, 8) },
      ]}
    >
      <AbandonedCheckoutDetail checkout={checkout} />
    </AdminPageLayout>
  );
}
