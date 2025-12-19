/**
 * Centralized navigation structure
 * Route definitions and icon mappings
 */

import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  DollarSign,
  FolderOpen,
  FolderTree,
  HardDrive,
  LayoutDashboard,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Users,
} from "lucide-react";

export type AdminRole =
  | "admin"
  | "customer"
  | "support"
  | "reviewer"
  | "marketing";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  children?: NavItem[];
  roles?: AdminRole[]; // For future role-based access control
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Package,
        children: [
          {
            label: "All Products",
            href: "/products",
            icon: Package,
          },
          {
            label: "Create Product",
            href: "/products/create",
            icon: Plus,
          },
          {
            label: "Collections",
            href: "/products/collections",
            icon: FolderOpen,
          },
          {
            label: "Categories",
            href: "/products/categories",
            icon: FolderTree,
          },
          {
            label: "Inventory",
            href: "/products/inventory",
            icon: Boxes,
          },
        ],
      },
    ],
  },
  {
    items: [
      {
        label: "Orders",
        href: "/orders",
        icon: ShoppingCart,
        children: [
          {
            label: "All Orders",
            href: "/orders",
            icon: ShoppingCart,
          },
          {
            label: "Abandoned Checkouts",
            href: "/orders/abandoned",
            icon: ShoppingBag,
          },
        ],
      },
    ],
  },
  {
    items: [
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
      },
    ],
  },
  {
    items: [
      {
        label: "Discounts",
        href: "/discounts",
        icon: Tag,
      },
    ],
  },
  {
    items: [
      {
        label: "Price Lists",
        href: "/price-lists",
        icon: DollarSign,
      },
    ],
  },
  {
    items: [
      {
        label: "Bundles",
        href: "/bundles",
        icon: Boxes,
      },
    ],
  },
  {
    items: [
      {
        label: "Reviews",
        href: "/reviews",
        icon: Star,
      },
    ],
  },
  {
    items: [
      {
        label: "Storage",
        href: "/storage",
        icon: HardDrive,
      },
    ],
  },
  {
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

/**
 * Get all navigation items flattened (for search)
 */
export function getAllNavItems(): NavItem[] {
  const items: NavItem[] = [];
  navigation.forEach((section) => {
    section.items.forEach((item) => {
      items.push(item);
      if (item.children) {
        items.push(...item.children);
      }
    });
  });
  return items;
}

/**
 * Find nav item by href
 */
export function findNavItemByHref(href: string): NavItem | undefined {
  for (const section of navigation) {
    for (const item of section.items) {
      if (item.href === href) {
        return item;
      }
      if (item.children) {
        const child = item.children.find((c) => c.href === href);
        if (child) return child;
      }
    }
  }
  return undefined;
}
