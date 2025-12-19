"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Package } from "lucide-react";

interface InventoryEditorProps {
  currentQuantity: number;
  reservedQuantity?: number;
  onAdjust: (quantity: number) => void;
  onSetExact: (quantity: number) => void;
  onMarkOutOfStock: () => void;
  isLoading?: boolean;
}

export function InventoryEditor({
  currentQuantity,
  reservedQuantity = 0,
  onAdjust,
  onSetExact,
  onMarkOutOfStock,
  isLoading = false,
}: InventoryEditorProps) {
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [exactQuantity, setExactQuantity] = useState<string>("");

  const availableQuantity = currentQuantity - reservedQuantity;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Inventory</CardTitle>
        <CardDescription>Manage stock levels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Total</div>
            <div className="text-lg font-semibold">{currentQuantity}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Reserved</div>
            <div className="text-lg font-semibold">{reservedQuantity}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Available</div>
            <div className={`text-lg font-semibold ${availableQuantity <= 0 ? "text-destructive" : ""}`}>
              {availableQuantity}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Adjust Inventory</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Amount"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const amount = parseInt(adjustAmount, 10);
                if (!isNaN(amount) && amount !== 0) {
                  onAdjust(amount);
                  setAdjustAmount("");
                }
              }}
              disabled={isLoading || !adjustAmount}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const amount = parseInt(adjustAmount, 10);
                if (!isNaN(amount) && amount !== 0) {
                  onAdjust(-amount);
                  setAdjustAmount("");
                }
              }}
              disabled={isLoading || !adjustAmount}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Set Exact Quantity</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Quantity"
              value={exactQuantity}
              onChange={(e) => setExactQuantity(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => {
                const quantity = parseInt(exactQuantity, 10);
                if (!isNaN(quantity) && quantity >= 0) {
                  onSetExact(quantity);
                  setExactQuantity("");
                }
              }}
              disabled={isLoading || exactQuantity === ""}
            >
              Set
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={onMarkOutOfStock}
          disabled={isLoading}
        >
          <Package className="mr-2 h-4 w-4" />
          Mark as Out of Stock
        </Button>
      </CardContent>
    </Card>
  );
}

