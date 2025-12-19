"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { Address } from "@/lib/types/orders";

interface AddressCardProps {
  address: Address;
  title: string;
  editable?: boolean;
  onEdit?: () => void;
}

export function AddressCard({
  address,
  title,
  editable = false,
  onEdit,
}: AddressCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {editable && onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
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
          {address.phone && <p className="text-muted-foreground">Phone: {address.phone}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

