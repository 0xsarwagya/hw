"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCommandK } from "@/hooks/use-command-k";
import { getAllNavItems } from "@/lib/navigation";

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, closeCommandPalette } = useCommandK();
  const [search, setSearch] = useState("");
  const navItems = getAllNavItems();

  // Filter items based on search
  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Group items by section
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

  return (
    <CommandDialog open={isOpen} onOpenChange={closeCommandPalette}>
      <CommandInput
        placeholder="Search navigation..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
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
