"use client";

import { Package, ShoppingCart } from "lucide-react";
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
import { useVariantsIndex } from "@/hooks/inventory/use-variants-index";
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

  // Search inventory variants if query looks like SKU
  const shouldSearchInventory = useMemo(() => {
    const trimmed = search.trim();
    return (
      trimmed.length > 0 &&
      (trimmed.toLowerCase().includes("inventory") ||
        trimmed.toLowerCase().includes("sku") ||
        /^[A-Z0-9-]+$/i.test(trimmed))
    );
  }, [search]);

  const { data: variantsIndex } = useVariantsIndex();
  const matchingVariants = useMemo(() => {
    if (!shouldSearchInventory || !variantsIndex) return [];
    const query = search.trim().toLowerCase();
    return variantsIndex.variants
      .filter(
        (v) =>
          v.sku.toLowerCase().includes(query) ||
          v.productTitle.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [shouldSearchInventory, variantsIndex, search]);

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

        {shouldSearchInventory && matchingVariants.length > 0 && (
          <CommandGroup heading="Inventory">
            {matchingVariants.map((variant) => (
              <CommandItem
                key={variant.variantId}
                value={`inventory-${variant.sku}`}
                onSelect={() => handleSelect(`/inventory/${variant.variantId}`)}
              >
                <Package className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{variant.sku}</span>
                  <span className="text-xs text-muted-foreground">
                    {variant.productTitle}
                  </span>
                </div>
              </CommandItem>
            ))}
            <CommandItem
              value="view-all-inventory"
              onSelect={() => handleSelect("/inventory")}
            >
              <Package className="mr-2 h-4 w-4" />
              View all inventory
            </CommandItem>
            <CommandItem
              value="bulk-adjust-inventory"
              onSelect={() => handleSelect("/inventory/bulk-adjust")}
            >
              <Package className="mr-2 h-4 w-4" />
              Bulk Adjust Inventory
            </CommandItem>
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
