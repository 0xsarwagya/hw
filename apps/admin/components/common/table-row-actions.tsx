"use client";

import { LucideIcon, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Action item configuration
 */
export interface TableRowAction {
  /**
   * Label to display
   */
  label: string;

  /**
   * Icon to display (optional)
   */
  icon?: LucideIcon;

  /**
   * Action type determines behavior
   */
  type: "link" | "button" | "separator";

  /**
   * For link type: href to navigate to
   */
  href?: string;

  /**
   * For button type: onClick handler
   */
  onClick?: () => void;

  /**
   * Whether this action is destructive (red text)
   */
  destructive?: boolean;

  /**
   * Whether the action is disabled
   */
  disabled?: boolean;
}

/**
 * Props for TableRowActions component
 */
export interface TableRowActionsProps {
  /**
   * Array of actions to display
   */
  actions: TableRowAction[];

  /**
   * Callback to stop event propagation (useful when row is clickable)
   */
  onActionClick?: (e: React.MouseEvent) => void;
}

/**
 * Reusable component for table row action dropdown menus
 *
 * Provides a consistent UI for actions like Edit, Delete, Duplicate, etc.
 *
 * @example
 * ```tsx
 * <TableRowActions
 *   actions={[
 *     { type: "link", label: "Edit", href: `/products/${product.id}`, icon: Edit },
 *     { type: "button", label: "Duplicate", onClick: handleDuplicate, icon: Copy },
 *     { type: "separator" },
 *     { type: "button", label: "Delete", onClick: handleDelete, icon: Trash2, destructive: true },
 *   ]}
 * />
 * ```
 */
export function TableRowActions({
  actions,
  onActionClick,
}: TableRowActionsProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActionClick?.(e);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleClick}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => {
          if (action.type === "separator") {
            return <DropdownMenuSeparator key={`separator-${String(index)}`} />;
          }

          if (action.type === "link" && action.href) {
            return (
              <DropdownMenuItem
                key={action.label}
                asChild
                disabled={action.disabled}
              >
                <Link href={action.href} onClick={handleClick}>
                  {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Link>
              </DropdownMenuItem>
            );
          }

          if (action.type === "button" && action.onClick) {
            return (
              <DropdownMenuItem
                key={action.label}
                onClick={(e) => {
                  handleClick(e);
                  action.onClick?.();
                }}
                disabled={action.disabled}
                className={action.destructive ? "text-destructive" : ""}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            );
          }

          return null;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
