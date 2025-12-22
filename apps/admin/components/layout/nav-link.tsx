"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number | string;
  isChild?: boolean;
}

export function NavLink({
  href,
  icon: Icon,
  label,
  badge,
  isChild = false,
}: NavLinkProps) {
  const pathname = usePathname();

  // Only match exact paths or direct children (one level deep)
  // This prevents multiple sidebar items from being highlighted
  let isActive = false;

  if (pathname === href) {
    // Exact match
    isActive = true;
  } else if (href !== "/" && pathname.startsWith(`${href}/`)) {
    // Check if it's a direct child (only one level deeper)
    // e.g., /orders matches /orders/123 but not /orders/123/details
    const pathAfterHref = pathname.slice(href.length + 1);
    const segments = pathAfterHref.split("/").filter(Boolean);
    // Only match if there's exactly one segment (direct child)
    isActive = segments.length === 1;
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isChild && "ml-6",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <Badge variant="secondary" className="ml-auto">
          {badge}
        </Badge>
      )}
    </Link>
  );
}
