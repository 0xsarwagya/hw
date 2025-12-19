"use client";

import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipments } from "@/hooks/shipping/use-shipments";
import type { Order } from "@/lib/types/orders";
import { AddressCard } from "./address-card";
import { CreateShipmentDialog } from "./create-shipment-dialog";
import { ShipmentCard } from "./shipment-card";

interface OrderShippingSectionProps {
  order: Order;
}

export function OrderShippingSection({ order }: OrderShippingSectionProps) {
  const { data: shipments } = useShipments(order.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shipping</CardTitle>
        {order.status !== "cancelled" && order.status !== "refunded" && (
          <CreateShipmentDialog orderId={order.id} />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {order.shippingAddress && (
          <AddressCard
            address={order.shippingAddress}
            title="Shipping Address"
          />
        )}
        {order.billingAddress &&
          order.billingAddress.id !== order.shippingAddress?.id && (
            <AddressCard
              address={order.billingAddress}
              title="Billing Address"
            />
          )}
        {shipments && shipments.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Shipments</h4>
            {shipments.map((shipment) => (
              <ShipmentCard key={shipment.id} shipment={shipment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No shipments created yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
