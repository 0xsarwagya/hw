/**
 * Centralized navigation structure
 * Route definitions and icon mappings
 */

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Boxes,
  DollarSign,
  FileSearch,
  FileText,
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
  Store,
  Tag,
  UserCog,
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
    label: "Catalog",
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
        ],
      },
      {
        label: "Categories",
        href: "/products/categories",
        icon: FolderTree,
      },
      {
        label: "Collections",
        href: "/products/collections",
        icon: FolderOpen,
      },
      {
        label: "Inventory",
        href: "/inventory",
        icon: Boxes,
        children: [
          {
            label: "All Inventory",
            href: "/inventory",
            icon: Boxes,
          },
          {
            label: "Settings",
            href: "/inventory/settings",
            icon: Settings,
          },
          {
            label: "Bulk Adjust",
            href: "/inventory/bulk-adjust",
            icon: Plus,
          },
        ],
      },
    ],
  },
  {
    label: "Sales",
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
    label: "Marketing",
    items: [
      {
        label: "Discounts",
        href: "/discounts",
        icon: Tag,
      },
      {
        label: "Price Lists",
        href: "/price-lists",
        icon: DollarSign,
      },
      {
        label: "Customer Groups",
        href: "/customer-groups",
        icon: UserCog,
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
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: FileSearch,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        label: "Activity Logs",
        href: "/activity-logs",
        icon: BookOpen,
      },
      {
        label: "System Logs",
        href: "/settings/system-logs",
        icon: FileText,
      },
      {
        label: "Roles & Permissions",
        href: "/settings/roles",
        icon: UserCog,
      },
      {
        label: "Store Settings",
        href: "/settings/store",
        icon: Store,
      },
      {
        label: "Currency",
        href: "/settings/currency",
        icon: DollarSign,
      },
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
