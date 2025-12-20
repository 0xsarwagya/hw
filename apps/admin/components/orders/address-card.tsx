"use client";

import { CheckCircle2, Pencil, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShiprocketCouriers } from "@/hooks/shipping/use-shiprocket-couriers";
import type { Address, Order } from "@/lib/types/orders";
import { EditAddressDialog } from "./edit-address-dialog";

interface AddressCardProps {
  address: Address;
  title: string;
  orderId?: string;
  order?: Order;
  editable?: boolean;
}

export function AddressCard({
  address,
  title,
  orderId,
  order,
  editable = true,
}: AddressCardProps) {
  const [validating, setValidating] = useState(false);
  const [serviceabilityResult, setServiceabilityResult] = useState<{
    serviceable: boolean;
    message?: string;
  } | null>(null);

  const { data: couriersData, refetch: checkServiceability } =
    useShiprocketCouriers(
      order?.shippingAddress
        ? {
            pickupPincode: "400001", // Default pickup - should come from settings
            deliveryPincode: address.pincode,
            weight: 1, // Default weight
            orderValue: order.total,
            codAmount: order.paymentMethod === "COD" ? order.total : undefined,
          }
        : undefined,
    );

  const handleValidatePostalCode = async () => {
    if (!order || !order.shippingAddress) {
      toast.error("Order information required for validation");
      return;
    }

    setValidating(true);
    try {
      await checkServiceability();
      if (couriersData && couriersData.couriers.length > 0) {
        setServiceabilityResult({
          serviceable: true,
          message: `${couriersData.couriers.length} courier(s) available`,
        });
        toast.success("Postal code is serviceable");
      } else {
        setServiceabilityResult({
          serviceable: false,
          message: "No couriers available for this postal code",
        });
        toast.error("Postal code is not serviceable");
      }
    } catch (_error) {
      setServiceabilityResult({
        serviceable: false,
        message: "Failed to check serviceability",
      });
      toast.error("Failed to validate postal code");
    } finally {
      setValidating(false);
    }
  };

  const addressType = title.toLowerCase().includes("shipping")
    ? "shipping"
    : "billing";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {editable && orderId && (
            <EditAddressDialog
              orderId={orderId}
              address={address}
              addressType={addressType}
              trigger={
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          )}
          {addressType === "shipping" && order && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleValidatePostalCode}
              disabled={validating}
            >
              {validating ? (
                "Checking..."
              ) : serviceabilityResult?.serviceable ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : serviceabilityResult ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                "Validate"
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <p className="font-medium">{address.name}</p>
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {address.city}, {address.state} {address.pincode}
          </p>
          <p>{address.country}</p>
          {address.phone && (
            <p className="text-muted-foreground">Phone: {address.phone}</p>
          )}
          {address.landmark && (
            <p className="text-muted-foreground">
              Landmark: {address.landmark}
            </p>
          )}
          {serviceabilityResult && (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                serviceabilityResult.serviceable
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {serviceabilityResult.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
