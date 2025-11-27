import { Metadata } from "next";
import { OrderList } from "@/components/orders/order-list";

export const metadata: Metadata = {
  title: "Orders | VCEcom Admin",
  description: "Manage orders in the VCEcom admin dashboard",
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage and track all customer orders
        </p>
      </div>

      <OrderList />
    </div>
  );
}
