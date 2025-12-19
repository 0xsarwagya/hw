"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateShipment } from "@/hooks/shipping/use-create-shipment";
import { Package } from "lucide-react";

interface CreateShipmentDialogProps {
  orderId: string;
}

export function CreateShipmentDialog({ orderId }: CreateShipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [courierId, setCourierId] = useState("");
  const [pickupPincode, setPickupPincode] = useState("");
  const [weight, setWeight] = useState("");

  const createShipment = useCreateShipment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createShipment.mutateAsync({
      orderId,
      courierId: parseInt(courierId),
      pickupPincode: pickupPincode || undefined,
      weight: weight ? parseFloat(weight) : undefined,
    });
    setOpen(false);
    setCourierId("");
    setPickupPincode("");
    setWeight("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Create Shipment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Shipment</DialogTitle>
          <DialogDescription>
            Create a shipment for this order using Shiprocket
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="courierId">Courier ID *</Label>
            <Input
              id="courierId"
              type="number"
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              required
              placeholder="Enter courier ID"
            />
          </div>
          <div>
            <Label htmlFor="pickupPincode">Pickup PIN Code</Label>
            <Input
              id="pickupPincode"
              value={pickupPincode}
              onChange={(e) => setPickupPincode(e.target.value)}
              placeholder="e.g., 400001"
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 1.5"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createShipment.isPending}>
              {createShipment.isPending ? "Creating..." : "Create Shipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

