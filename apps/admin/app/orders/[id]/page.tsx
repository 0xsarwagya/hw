import { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetails } from "@/components/orders/order-details";

interface OrderPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: "Order Details | VCEcom Admin",
  description: "View and manage order details in the VCEcom admin dashboard",
};

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = params;

  // Basic validation - in a real app you'd validate the ID format
  if (!id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        <p className="text-muted-foreground">
          View and manage order information
        </p>
      </div>

      <OrderDetails orderId={id} />
    </div>
  );
}
