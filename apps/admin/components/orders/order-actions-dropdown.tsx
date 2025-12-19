"use client";

import { Copy, Download, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Order } from "@/lib/types/orders";

interface OrderActionsDropdownProps {
  order: Order;
}

export function OrderActionsDropdown({ order }: OrderActionsDropdownProps) {
  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    toast.success("Order ID copied to clipboard");
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    toast.success("Order number copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyOrderId}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Order ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyOrderNumber}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Order Number
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Download className="mr-2 h-4 w-4" />
          Download Invoice
        </DropdownMenuItem>
        {order.status !== "cancelled" && order.status !== "refunded" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel Order
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
