"use client";

import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Store selector component
 *
 * Note: Currently shows single store. Multi-store support
 * requires backend implementation of store management APIs.
 */
export function StoreSelector() {
  // TODO: Replace with actual store data when backend implements multi-store
  const currentStore = {
    id: "default",
    name: "Default Store",
    currency: "INR",
  };

  const stores = [currentStore]; // Will be populated from API

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Store className="h-4 w-4" />
          <span className="hidden md:inline">{currentStore.name}</span>
          <Badge variant="secondary" className="ml-1">
            {currentStore.currency}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Select Store</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{store.name}</span>
              <span className="text-xs text-muted-foreground">
                {store.currency}
              </span>
            </div>
            {store.id === currentStore.id && (
              <Badge variant="default" className="ml-2">
                Current
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
        {stores.length === 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <span className="text-xs text-muted-foreground">
                Multi-store coming soon
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
