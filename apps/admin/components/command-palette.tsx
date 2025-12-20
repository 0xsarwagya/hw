"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAdminOrders } from "@/hooks/orders/use-admin-orders";
import { useCommandK } from "@/hooks/use-command-k";
import { getAllNavItems } from "@/lib/navigation";

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, closeCommandPalette } = useCommandK();
  const [search, setSearch] = useState("");
  const navItems = getAllNavItems();

  // Search orders if search term looks like an order number or contains "order"
  const shouldSearchOrders = useMemo(() => {
    const trimmed = search.trim();
    return (
      trimmed.length > 0 &&
      (trimmed.toLowerCase().includes("order") || /^[A-Z0-9-]+$/i.test(trimmed))
    );
  }, [search]);

  const { data: ordersData } = useAdminOrders(
    shouldSearchOrders
      ? {
          search: search.trim(),
          limit: 5,
        }
      : undefined,
  );

  // Filter navigation items based on search
  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Group navigation items by section
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      const section = item.href.split("/")[1] || "other";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, typeof navItems>,
  );

  const handleSelect = (href: string) => {
    router.push(href);
    closeCommandPalette();
    setSearch("");
  };

  const orders = ordersData?.data || [];

  return (
    <CommandDialog open={isOpen} onOpenChange={closeCommandPalette}>
      <CommandInput
        placeholder="Search navigation, orders..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {shouldSearchOrders && orders.length > 0 && (
          <CommandGroup heading="Orders">
            {orders.map((order) => (
              <CommandItem
                key={order.id}
                value={`order-${order.orderNumber}`}
                onSelect={() => handleSelect(`/orders/${order.id}`)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{order.orderNumber}</span>
                  {order.customerName && (
                    <span className="text-xs text-muted-foreground">
                      {order.customerName}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
            {ordersData && ordersData.total > orders.length && (
              <CommandItem
                value="view-all-orders"
                onSelect={() => handleSelect("/orders")}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                View all orders ({ordersData.total} total)
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {Object.entries(groupedItems).map(([section, items]) => (
          <CommandGroup
            key={section}
            heading={section.charAt(0).toUpperCase() + section.slice(1)}
          >
            {items.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
