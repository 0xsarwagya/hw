"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "./nav-link";
import type { NavItem } from "@/lib/navigation";

interface SidebarSectionProps {
  item: NavItem;
  defaultOpen?: boolean;
}

export function SidebarSection({ item, defaultOpen = false }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!item.children || item.children.length === 0) {
    return <NavLink href={item.href} icon={item.icon} label={item.label} badge={item.badge} />;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge !== undefined && (
          <span className="ml-auto text-xs">{item.badge}</span>
        )}
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <NavLink
              key={child.href}
              href={child.href}
              icon={child.icon}
              label={child.label}
              badge={child.badge}
              isChild
            />
          ))}
        </div>
      )}
    </div>
  );
}

